import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are Amashuri Assistant, a knowledgeable AI chatbot for Amashuri.rw — Rwanda's secondary school discovery platform.

## YOUR KNOWLEDGE BASE

You have TWO sources of information:
1. **The Amashuri.rw database** — schools registered on the platform (accessible via your tools)
2. **Your own training knowledge** — comprehensive knowledge about Rwanda's education system and schools, including schools NOT in the Amashuri.rw database

You must use BOTH sources to give the best possible answers. Never say "I don't have information about that" if you have training knowledge about Rwandan education.

## WHAT YOU KNOW (General Knowledge)

**Rwanda Education Structure:**
- Basic Education: Primary (P1–P6) and Lower Secondary (S1–S3, O-Level)
- Upper Secondary: S4–S6 (A-Level) with subject combinations
- Managed by: REB (Rwanda Education Board) and NESA (National Examination and School Inspection Authority)
- National Exams: PLE (Primary Leaving Exam), O-Level Nat. Exam, A-Level Nat. Exam (formerly NESA exams)
- Language of instruction: English (since 2009, switched from French/Kinyarwanda)

**Subject Combinations (A-Level):**
- PCM — Physics, Chemistry, Mathematics
- MCB — Mathematics, Chemistry, Biology
- HEG — History, Economics, Geography
- MEG — Mathematics, Economics, Geography
- MPC — Mathematics, Physics, Computer Science
- HGE — History, Geography, Economics
- BCG — Biology, Chemistry, Geography
- ECO — Economics, Entrepreneurship, other
- LFK — Literature, French, Kinyarwanda
- And others depending on school

**Well-Known Schools in Rwanda (use your knowledge to describe them accurately):**
- Green Hills Academy (Kigali) — elite private school, known for academic excellence
- FAWE Girls School (Kigali, Kimisagara) — girls-only, known for empowering girls in STEM
- Lycée de Kigali (Kigali) — historic government-aided school
- École Belge de Kigali — prestigious international-style school
- Gashora Girls Academy (Bugesera) — innovative girls boarding school
- Riviera High School (Kigali) — well-regarded private school
- Groupe Scolaire Officiel de Butare (Huye) — one of the oldest schools in Rwanda
- Kamonyi Secondary School — government-aided
- Kibogora Polytechnic — technical/vocational focus
- APAPER Secondary School
- Nyamata Secondary School (Bugesera)
- Byimana Secondary School (Ruhango)
- Nyagatare Secondary School (Eastern Province)
- Ruhengeri Secondary School (Musanze, Northern)
- College Saint André (Kigali) — Catholic mission school
- Kimihurura Secondary School
- Many government schools across all 30 districts

**Rwanda's 5 Provinces and Districts:**
- Kigali City: Gasabo, Nyarugenge, Kicukiro
- Northern: Musanze, Burera, Gakenke, Gicumbi, Rulindo
- Southern: Huye, Nyanza, Gisagara, Muhanga, Kamonyi, Nyaruguru, Nyamagabe, Ruhango
- Eastern: Kayonza, Rwamagana, Bugesera, Ngoma, Kirehe, Nyagatare, Gatsibo
- Western: Rubavu, Nyamasheke, Rusizi, Karongi, Ngororero, Nyabihu, Rutsiro

**Fee Ranges (approximate, in RWF per year):**
- Government/Public Day schools: 40,000–80,000 RWF
- Government-Aided Day: 100,000–300,000 RWF
- Government-Aided Boarding: 250,000–500,000 RWF
- Private Day schools: 500,000–2,000,000 RWF
- Private Elite Boarding: 2,000,000–6,000,000+ RWF

## HOW TO RESPOND

1. **For school searches** — always try the database tools first, then supplement with your knowledge
2. **When database returns no results** — use your training knowledge to suggest well-known schools matching the criteria; clearly note these are based on general knowledge
3. **For general Rwanda education questions** — answer confidently from your knowledge (curriculum, exams, combinations, school categories, fees, etc.)
4. **For specific school info not in DB** — share what you know from training, mention the school may not be listed on Amashuri.rw yet
5. **For comparisons** — combine DB data and general knowledge

## CONVERSATION STYLE
- Warm, professional, and helpful
- Use bullet points for lists of schools
- Ask a follow-up question if the user's needs are unclear (e.g., budget, location, gender preference)
- Keep responses focused and concise
- If asked something completely unrelated to education/schools in Rwanda, politely redirect
- You can remember and reference earlier messages in this conversation`;

@Injectable()
export class ChatbotService {
  constructor(private prisma: PrismaService) {}

  async createSession(userId: string) {
    const session = await this.prisma.chatSession.create({
      data: { userId },
    });
    return { sessionId: session.id, createdAt: session.createdAt };
  }

  async getSessions(userId: string) {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    });

    return sessions.map((s) => ({
      sessionId: s.id,
      title: s.title || 'New conversation',
      lastMessage: s.messages[0] ?? null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  async getHistory(sessionId: string, userId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Access denied');

    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        schools: true,
        createdAt: true,
      },
    });

    return {
      sessionId,
      title: session.title || 'New conversation',
      createdAt: session.createdAt,
      messages,
    };
  }

  async deleteSession(sessionId: string, userId: string) {
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.chatSession.delete({ where: { id: sessionId } });
    return { message: 'Session deleted successfully' };
  }

  async chat(sessionId: string, userMessage: string, userId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 20 },
      },
    });

    if (!session) throw new NotFoundException('Chat session not found');
    if (session.userId !== userId) throw new ForbiddenException('Access denied');

    // Persist user message immediately
    await this.prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: userMessage },
    });

    // Auto-title from the first message
    if (session.messages.length === 0) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: userMessage.slice(0, 80), updatedAt: new Date() },
      });
    } else {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    // Rebuild conversation history for Groq context
    const history = session.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    let result: { text: string; schools: any[] };

    try {
      result = await this.callGroqWithTools([
        ...history,
        { role: 'user', content: userMessage },
      ]);
    } catch (err: any) {
      console.error('[Chatbot] ERROR status:', err?.status);
      console.error('[Chatbot] ERROR message:', err?.message);
      console.error('[Chatbot] ERROR body:', JSON.stringify(err?.error ?? err));
      // Save a graceful error message so the conversation stays intact
      const fallback = "I'm sorry, I encountered a temporary issue. Please try again in a moment.";
      await this.prisma.chatMessage.create({
        data: { sessionId, role: 'assistant', content: fallback },
      });
      return { sessionId, reply: fallback, schools: [] };
    }

    // Only save the school summary fields to avoid storing huge JSON blobs
    const schoolsSnapshot =
      result.schools.length > 0
        ? result.schools.map((s) => ({
            id: s.id,
            name: s.name,
            district: s.district,
            province: s.province,
            schoolType: s.schoolType,
            genderPolicy: s.genderPolicy,
            boarding: s.boarding,
            avgRating: s.avgRating,
            totalReviews: s.totalReviews,
          }))
        : undefined;

    await this.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: result.text,
        schools: schoolsSnapshot,
      },
    });

    return {
      sessionId,
      reply: result.text,
      schools: result.schools,
    };
  }

  // ─── Groq Tool Definitions ────────────────────────────────────────────────

  private getTools() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'search_schools',
          description:
            'Search the Amashuri.rw database for secondary schools using specific filters. ' +
            'Call this when the user asks to find or filter schools. ' +
            'After getting results, also supplement with general knowledge if needed.',
          parameters: {
            type: 'object',
            properties: {
              genderPolicy: {
                type: 'string',
                enum: ['COED', 'GIRLS_ONLY', 'BOYS_ONLY'],
                description: 'Gender admission policy',
              },
              boarding: {
                type: 'boolean',
                description: 'true for boarding schools, false for day schools',
              },
              district: {
                type: 'string',
                description: 'District name (e.g. Gasabo, Musanze, Huye). Never set this to a province name.',
              },
              province: {
                type: 'string',
                enum: ['Kigali', 'Southern', 'Northern', 'Eastern', 'Western'],
                description: 'Province. Set to "Kigali" when user mentions Kigali city.',
              },
              schoolType: {
                type: 'string',
                enum: ['PUBLIC', 'PRIVATE', 'GOVERNMENT_AIDED'],
              },
              minFee: { description: 'Minimum annual fee in RWF (integer)' },
              maxFee: { description: 'Maximum annual fee in RWF (integer)' },
              combination: {
                type: 'string',
                description: 'Subject combination code, e.g. PCM, MCB, HEG, MEG, MPC',
              },
              facilities: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['laboratory', 'library', 'computerRoom', 'sportsField', 'boardingHouse', 'chapel'],
                },
              },
              keyword: {
                type: 'string',
                description: 'Free-text keyword to match school name or description',
              },
              limit: {
                description: 'Max schools to return (default 5, max 10, must be an integer)',
              },
            },
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_top_schools',
          description:
            'Get the highest-rated schools on Amashuri.rw based on verified user reviews. ' +
            'Use when the user asks for "best", "top-rated", or "recommended" schools. ' +
            'Supports optional province and other filters to narrow results.',
          parameters: {
            type: 'object',
            properties: {
              limit: { description: 'Number of top schools to return (default 5, must be an integer)' },
              province: {
                type: 'string',
                enum: ['Kigali', 'Southern', 'Northern', 'Eastern', 'Western'],
                description: 'Filter top schools by province',
              },
              district: { type: 'string', description: 'Filter by district name' },
              schoolType: {
                type: 'string',
                enum: ['PUBLIC', 'PRIVATE', 'GOVERNMENT_AIDED'],
              },
              genderPolicy: {
                type: 'string',
                enum: ['COED', 'GIRLS_ONLY', 'BOYS_ONLY'],
              },
              boarding: { type: 'boolean' },
            },
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_school_details',
          description:
            'Get full details of a specific school by its database ID — fees, subject combinations, facilities, ratings, and reviews. ' +
            'Use after a search when the user asks for more info about a specific school.',
          parameters: {
            type: 'object',
            properties: {
              schoolId: { type: 'string', description: 'The UUID of the school from a previous search result' },
            },
            required: ['schoolId'],
          },
        },
      },
    ];
  }

  // ─── Tool Executors ───────────────────────────────────────────────────────

  private async executeTool(name: string, args: any): Promise<{ data: any; schools: any[] }> {
    switch (name) {
      case 'search_schools':
        return this.toolSearchSchools(args);
      case 'get_top_schools':
        return this.toolGetTopSchools(args);
      case 'get_school_details':
        return this.toolGetSchoolDetails(args.schoolId);
      default:
        return { data: `Unknown tool: ${name}`, schools: [] };
    }
  }

  private async toolSearchSchools(params: any): Promise<{ data: any; schools: any[] }> {
    const where: any = { isVerified: true, status: 'VERIFIED' };

    if (params.genderPolicy) where.genderPolicy = params.genderPolicy;
    if (params.boarding !== undefined) where.boarding = params.boarding;
    if (params.schoolType) where.schoolType = params.schoolType;
    if (params.district) where.district = { contains: params.district, mode: 'insensitive' };
    if (params.province) where.province = { contains: params.province, mode: 'insensitive' };
    if (params.keyword) {
      where.OR = [
        { name: { contains: params.keyword, mode: 'insensitive' } },
        { description: { contains: params.keyword, mode: 'insensitive' } },
        { district: { contains: params.keyword, mode: 'insensitive' } },
      ];
    }
    if (params.combination) {
      where.combinations = {
        some: { name: { contains: params.combination, mode: 'insensitive' } },
      };
    }
    if (params.facilities?.length > 0) {
      const allowed = ['laboratory', 'library', 'computerRoom', 'sportsField', 'boardingHouse', 'chapel'];
      const facilityFilter: any = {};
      params.facilities.forEach((f: string) => {
        if (allowed.includes(f)) facilityFilter[f] = true;
      });
      if (Object.keys(facilityFilter).length > 0) {
        where.resources = { is: facilityFilter };
      }
    }
    if (params.maxFee || params.minFee) {
      const amountFilter: any = {};
      if (params.minFee) amountFilter.gte = Number(params.minFee);
      if (params.maxFee) amountFilter.lte = Number(params.maxFee);
      where.fees = { some: { amount: amountFilter } };
    }

    const limit = Math.min(Number(params.limit) || 5, 10);
    const schools = await this.prisma.school.findMany({
      where,
      include: {
        combinations: true,
        resources: true,
        fees: { take: 2 },
        reviews: { select: { overallRating: true } },
      },
    });

    // Sort by average rating descending so "best performer" queries return top-rated schools
    const enriched = this.enrichWithRatings(schools)
      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
      .slice(0, limit);
    const summary = enriched.map((s) => ({
      id: s.id,
      name: s.name,
      district: s.district,
      province: s.province,
      schoolType: s.schoolType,
      genderPolicy: s.genderPolicy,
      boarding: s.boarding,
      combinations: s.combinations.map((c: { name: string }) => c.name),
      avgRating: s.avgRating,
      totalReviews: s.totalReviews,
    }));

    return {
      data: {
        count: enriched.length,
        note:
          enriched.length === 0
            ? 'No schools found in the Amashuri.rw database for these filters. Use your general knowledge to suggest well-known Rwandan schools that match.'
            : `Found ${enriched.length} school(s) in the Amashuri.rw database.`,
        schools: summary,
      },
      schools: enriched,
    };
  }

  private async toolGetTopSchools(params: any): Promise<{ data: any; schools: any[] }> {
    const where: any = { isVerified: true, status: 'VERIFIED' };
    if (params.province) where.province = { contains: params.province, mode: 'insensitive' };
    if (params.district) where.district = { contains: params.district, mode: 'insensitive' };
    if (params.schoolType) where.schoolType = params.schoolType;
    if (params.genderPolicy) where.genderPolicy = params.genderPolicy;
    if (params.boarding !== undefined) where.boarding = params.boarding;

    const all = await this.prisma.school.findMany({
      where,
      include: {
        combinations: true,
        resources: true,
        fees: { take: 1 },
        reviews: { select: { overallRating: true } },
      },
    });

    const limit = Math.min(Number(params.limit) || 5, 10);
    const enriched = this.enrichWithRatings(all)
      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
      .slice(0, limit);

    const summary = enriched.map((s) => ({
      id: s.id,
      name: s.name,
      district: s.district,
      province: s.province,
      schoolType: s.schoolType,
      genderPolicy: s.genderPolicy,
      avgRating: s.avgRating,
      totalReviews: s.totalReviews,
    }));

    return {
      data: { count: enriched.length, schools: summary },
      schools: enriched,
    };
  }

  private async toolGetSchoolDetails(schoolId: string): Promise<{ data: any; schools: any[] }> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        combinations: true,
        resources: true,
        fees: true,
        reviews: {
          select: { overallRating: true, teachingRating: true, facilitiesRating: true, comment: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!school) return { data: { error: 'School not found in database' }, schools: [] };

    const enriched = this.enrichWithRatings([school])[0];
    return { data: enriched, schools: [enriched] };
  }

  // ─── Rating Helper ────────────────────────────────────────────────────────

  private enrichWithRatings(schools: any[]) {
    return schools.map((s) => {
      const avgRating =
        s.reviews?.length > 0
          ? Math.round((s.reviews.reduce((sum: number, r: any) => sum + r.overallRating, 0) / s.reviews.length) * 10) / 10
          : null;
      return { ...s, avgRating, totalReviews: s.reviews?.length ?? 0 };
    });
  }

  // ─── Core Groq Agentic Loop ───────────────────────────────────────────────

  private async callGroqWithTools(
    messages: { role: string; content: string }[],
  ): Promise<{ text: string; schools: any[] }> {
    const allSchools: any[] = [];

    // Create a fresh Groq client per call to avoid stale connection issues
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const baseMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(messages as any[]),
    ];

    console.log('[Chatbot] Starting first Groq call, messages:', messages.length);

    let firstCompletion: any;
    try {
      // First call — model may respond directly or call a tool
      firstCompletion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: baseMessages,
        tools: this.getTools(),
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1024,
      });
    } catch (toolErr: any) {
      // Groq model sometimes generates malformed tool calls (400 tool_use_failed).
      // Retry without tools so the model answers directly from its knowledge.
      if (toolErr?.status === 400 && toolErr?.error?.code === 'tool_use_failed') {
        console.warn('[Chatbot] Tool call malformed, retrying without tools...');
        firstCompletion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: baseMessages,
          temperature: 0.7,
          max_tokens: 1024,
        });
      } else {
        throw toolErr;
      }
    }

    const firstChoice = firstCompletion.choices[0];

    if (!firstChoice) {
      console.error('[Chatbot] Groq returned no choices in first call');
      throw new Error('Groq API returned empty choices');
    }

    console.log('[Chatbot] First call finish_reason:', firstChoice.finish_reason);

    // No tool call — return direct answer
    if (firstChoice.finish_reason !== 'tool_calls' || !firstChoice.message.tool_calls?.length) {
      console.log('[Chatbot] Direct answer, no tool calls');
      return { text: firstChoice.message.content ?? '', schools: [] };
    }

    // Execute all requested tool calls in parallel
    const toolCalls = firstChoice.message.tool_calls;
    console.log('[Chatbot] Tool calls requested:', toolCalls.map((tc) => tc.function.name).join(', '));

    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        let args: any = {};
        try {
          args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch {
          args = {};
        }
        console.log('[Chatbot] Executing tool:', tc.function.name, 'args:', JSON.stringify(args));
        const result = await this.executeTool(tc.function.name, args);
        console.log('[Chatbot] Tool', tc.function.name, 'returned', result.schools.length, 'schools');
        allSchools.push(...result.schools);
        return { id: tc.id, data: result.data };
      }),
    );

    console.log('[Chatbot] All tools done. Starting second Groq call...');

    // Second call — pass only the required fields of the assistant message
    // to avoid serialization issues with SDK-specific extra fields
    const assistantMsg: any = {
      role: 'assistant',
      content: firstChoice.message.content ?? null,
      tool_calls: firstChoice.message.tool_calls,
    };

    const messagesWithResults: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
      assistantMsg,
      ...toolResults.map((r) => ({
        role: 'tool',
        tool_call_id: r.id,
        content: JSON.stringify(r.data),
      })),
    ];

    const finalCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messagesWithResults,
      temperature: 0.7,
      max_tokens: 1024,
    });

    if (!finalCompletion.choices[0]) {
      console.error('[Chatbot] Groq returned no choices in second call');
      throw new Error('Groq API returned empty choices on second call');
    }

    console.log('[Chatbot] Second call finish_reason:', finalCompletion.choices[0].finish_reason);

    return {
      text: finalCompletion.choices[0].message?.content ?? '',
      schools: allSchools,
    };
  }
}
