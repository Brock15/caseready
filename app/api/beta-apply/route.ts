import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      practiceArea,
      firmSize,
      casesPerMonth,
      currentProcess,
      whyCaseReady,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !practiceArea || !firmSize || !casesPerMonth || !currentProcess || !whyCaseReady) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to apply for beta access" },
        { status: 401 }
      );
    }

    // Check if user's email matches the form email
    if (user.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email must match your account email" },
        { status: 400 }
      );
    }

    // Check if user already has a beta application
    const { data: existingApplication } = await supabase
      .from("beta_applications")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingApplication) {
      return NextResponse.json({
        success: true,
        message: "You already have beta access",
      });
    }

    // Generate a unique beta token
    const betaToken = `beta_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Store beta application
    const { error: insertError } = await supabase
      .from("beta_applications")
      .insert({
        user_id: user.id,
        name,
        email: email.toLowerCase(),
        phone,
        practice_area: practiceArea,
        firm_size: firmSize,
        cases_per_month: casesPerMonth,
        current_process: currentProcess,
        why_caseready: whyCaseReady,
        beta_token: betaToken,
        approved: true, // Auto-approve
        approved_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to store beta application:", insertError);
      return NextResponse.json(
        { error: "Failed to submit application. Please try again." },
        { status: 500 }
      );
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: "Beta access approved!",
    });
  } catch (error) {
    console.error("Beta application error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
