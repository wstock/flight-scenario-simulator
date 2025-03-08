import { createApiLogger } from '@/lib/utils/logger';
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const logger = createApiLogger('DynamicRoute');

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

