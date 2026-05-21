import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';

@Injectable()
export class SearchService {
  private groq: Groq;

  constructor(private prisma: PrismaService) {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }


  private extractJson(responseText: string): any {
    const cleaned = responseText.trim();

    // Try to find JSON object between first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        // Try removing common markdown artifacts
        const stripped = jsonStr
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .replace(/\n/g, '')
          .replace(/\r/g, '');
        try {
          return JSON.parse(stripped);
        } catch (e2) {
          throw new Error('Failed to extract valid JSON');
        }
      }
    }

    throw new Error('No JSON object found in response');
  }

  private async analyzeQuery(query: string): Promise<{
    intent: 'search' | 'recommendation' | 'general_education' | 'out_of_scope';
    params: any;
    pendingMessage: string;
    generalAnswer?: string;
  }> {
    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for Amashuri.rw, Rwanda's secondary school finder platform.

Your job is to analyze the user's query and return a single JSON object with these fields:

1. "intent" — classify the query as one of:
   - "search": user wants to find schools in the Amashuri.rw database using specific filters (e.g. boarding, district, gender, fees, combination)
   - "recommendation": user is asking the Amashuri.rw platform to show its top-rated schools from its database (e.g. "show me your best schools", "recommend schools on your platform")
   - "general_education": user asks a general knowledge question about Rwanda's education system or about specific school names/rankings/best schools in Rwanda — this is for ANY query where the user expects factual knowledge, NOT a database lookup. Also use this when the user asks for suggestions/advice/recommendations about schools with criteria like budget, location, etc. (e.g. "suggest a good school with budget 300000", "recommend a school in Kigali for my child", "I need a good secondary school for 500000 RWF"). Examples: "best schools in Rwanda", "top 10 secondary schools", "which school has the best science program", "name good schools in Kigali", "provide me the 2 best schools in Rwanda", "what are the best schools in the country", "I am a parent looking for a good school with budget 300000"

   - "out_of_scope": query has nothing to do with schools or education in Rwanda

2. "params" — ONLY if intent is "search", extract these filters (all optional):
   - genderPolicy: "COED", "GIRLS_ONLY", or "BOYS_ONLY"
   - boarding: true or false
   - district: specific district name like "Gasabo", "Nyarugenge", "Kicukiro", "Musanze", "Huye", "Ruhango" etc. NEVER set this to a province name.
   - province: "Kigali", "Southern", "Northern", "Eastern", or "Western". Note: "Kigali" is a province containing Gasabo, Nyarugenge and Kicukiro districts.
   - schoolType: "PUBLIC", "PRIVATE", or "GOVERNMENT_AIDED"
   - minFee: minimum fee in RWF as a number
   - maxFee: maximum fee in RWF as a number
   - combination: "PCM", "MCB", "HEG", "MEG", "MPC" etc
   - facilities: array from ["laboratory", "library", "computerRoom", "sportsField", "boardingHouse", "chapel"]
   - limit: number of schools user asked for (default: 5 if not specified). If user says "show me 2 schools", set limit: 2
   - search: general keyword if nothing specific matches
   IMPORTANT: Never set district and province to the same value. If user says "Kigali" only set province not district.
   If intent is NOT "search", set params to {}

3. "pendingMessage" — a short friendly message to show while results are loading:
   - For "search": something like "Searching for girls boarding schools in Kigali..."
   - For "recommendation": something like "Finding the top rated schools in Rwanda for you..."
   - For "general_education": answer the education question directly here in 3 sentences max. At the end suggest searching on Amashuri.rw if relevant.
   - For "out_of_scope": politely say you can only help with secondary schools in Rwanda and give an example query.

4. "generalAnswer" — ONLY if intent is "general_education", provide a detailed helpful answer. If the user asks about specific school names, rankings, or "best schools", use your general knowledge to name well-known Rwandan secondary schools (e.g. Green Hills Academy, FAWE Girls School, Lycée de Kigali, École Belge, Gashora Girls Academy, etc.). Otherwise set to null.

Return ONLY a raw JSON object. No explanation, no markdown, no backticks.`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    console.log('Groq response:', responseText);

    try {
      return this.extractJson(responseText);
    } catch (e) {
      console.error('Failed to parse Groq response:', e);
      return {
        intent: 'search',
        params: {},
        pendingMessage: 'Searching for schools...',
        generalAnswer: undefined,
      };
    }
  }

  
  private async generateFinalMessage(
    query: string,
    total: number,
    schools: any[],
  ): Promise<string> {
    if (total === 0) {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a friendly assistant for Amashuri.rw, Rwanda's secondary school finder.

No schools in the Amashuri.rw database matched the user's search criteria.

Use your general knowledge of Rwandan secondary schools to give helpful advice.
- Suggest well-known schools that might fit what they described
- Mention approximate fee ranges if you know them (e.g. public schools are often affordable, private schools vary)
- Suggest they search on Amashuri.rw for more specific options
- Be warm and helpful
- Maximum 4 sentences.`,
          },
          {
            role: 'user',
            content: `The user asked: "${query}"

No schools in the database matched. Give helpful general advice based on your knowledge.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content?.trim() ||
        'No schools in our database matched your criteria. Try adjusting your filters or searching with different keywords.';
    }

    const schoolNames = schools.slice(0, 3).map((s) => s.name).join(', ');
    const context = `Found ${total} school(s): ${schoolNames}${total > 3 ? ` and ${total - 3} more` : ''}.`;

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a friendly assistant for Amashuri.rw, Rwanda's secondary school finder.
Respond in maximum 2 sentences.
Confirm results in a warm friendly way.
Never list school names. No bullet points. Natural friendly text only.`,
        },
        {
          role: 'user',
          content: `User searched: "${query}"
Result: ${context}
Write a short friendly response.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    return completion.choices[0]?.message?.content?.trim() ||
      `Found ${total} school(s) matching your search.`;
  }

  
  private async handleRecommendationQuery(query: string, pendingMessage: string, limit: number = 5) {
    const schools = await this.prisma.school.findMany({
      where: { isVerified: true, status: 'VERIFIED' },
      include: {
        combinations: true,
        resources: true,
        fees: true,
        reviews: { select: { overallRating: true } },
      },
    });

    const topSchools = schools
      .map((school) => {
        const avgRating =
          school.reviews.length > 0
            ? school.reviews.reduce((sum, r) => sum + r.overallRating, 0) / school.reviews.length
            : 0;
        return {
          ...school,
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews: school.reviews.length,
        };
      })
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, limit);

    const message = await this.generateFinalMessage(query, topSchools.length, topSchools);

    return {
      query,
      intent: 'recommendation',
      message,
      data: topSchools,
      total: topSchools.length,
    };
  }

  
  async aiSearch(query: string) {
    if (!query || query.trim().length === 0) {
      return {
        intent: 'empty',
        message: 'Please type what you are looking for — for example: "girls boarding school in Kigali" or "public school with PCM in Northern Province".',
        data: [],
        total: 0,
      };
    }

    if (query.trim().length < 3) {
      return {
        intent: 'too_short',
        message: 'Your search is too short. Please type more details about the school you are looking for.',
        data: [],
        total: 0,
      };
    }

    try {
     
      const { intent, params, pendingMessage, generalAnswer } = await this.analyzeQuery(query);
      console.log('Intent:', intent, '| Params:', params);

     
      if (intent === 'out_of_scope') {
        return {
          query,
          intent,
          message: pendingMessage,
          data: [],
          total: 0,
        };
      }

      if (intent === 'general_education') {
        return {
          query,
          intent,
          message: generalAnswer || pendingMessage,
          data: [],
          total: 0,
        };
      }

      if (intent === 'recommendation') {
        return this.handleRecommendationQuery(query, pendingMessage, params.limit);
      }

      const where: any = {
        isVerified: true,
        status: 'VERIFIED',
      };

      if (params.genderPolicy) where.genderPolicy = params.genderPolicy;
      if (params.boarding !== undefined) where.boarding = params.boarding;
      if (params.schoolType) where.schoolType = params.schoolType;

      if (params.district) {
        where.district = { contains: params.district, mode: 'insensitive' };
      }
      if (params.province) {
        where.province = { contains: params.province, mode: 'insensitive' };
      }
      if (params.search) {
        where.OR = [
          { name: { contains: params.search, mode: 'insensitive' } },
          { district: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ];
      }
      if (params.combination) {
        where.combinations = {
          some: {
            name: { contains: params.combination, mode: 'insensitive' },
          },
        };
      }
      if (params.facilities && params.facilities.length > 0) {
        const facilityFilter: any = {};
        const allowed = ['laboratory', 'library', 'computerRoom', 'sportsField', 'boardingHouse', 'chapel'];
        params.facilities.forEach((facility: string) => {
          if (allowed.includes(facility)) facilityFilter[facility] = true;
        });
        if (Object.keys(facilityFilter).length > 0) {
          where.resources = { is: facilityFilter };
        }
      }
      if (params.maxFee || params.minFee) {
        const feeFilter: any = {};
        if (params.maxFee) feeFilter.lte = params.maxFee;
        if (params.minFee) feeFilter.gte = params.minFee;
        where.fees = {
          some: feeFilter,
        };
      }

      const schools = await this.prisma.school.findMany({
        where,
        take: params.limit || 5,
        include: {
          combinations: true,
          resources: true,
          fees: true,
          reviews: { select: { overallRating: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const schoolsWithRating = schools.map((school) => {
        const avgRating =
          school.reviews.length > 0
            ? school.reviews.reduce((sum, r) => sum + r.overallRating, 0) / school.reviews.length
            : 0;
        return {
          ...school,
          avgRating: Math.round(avgRating * 10) / 10,
          totalReviews: school.reviews.length,
        };
      });


      const message = await this.generateFinalMessage(
        query,
        schoolsWithRating.length,
        schoolsWithRating,
      );

      return {
        query,
        intent,
        message,
        extractedParams: params,
        data: schoolsWithRating,
        total: schoolsWithRating.length,
      };

    } catch (error) {
      console.error('AI Search error:', error);

      // Fallback basic search — no AI
      const schools = await this.prisma.school.findMany({
        where: {
          isVerified: true,
          status: 'VERIFIED',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { district: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { combinations: true, resources: true, fees: true },
      });

      return {
        query,
        intent: 'fallback',
        message: schools.length === 0
          ? 'No schools matched your search. Please try different keywords.'
          : `Found ${schools.length} school(s) matching your search.`,
        data: schools,
        total: schools.length,
      };
    }
  }
}