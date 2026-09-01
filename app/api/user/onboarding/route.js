import { prisma } from '@/lib/prisma.js';
import { getAuthUser, errorResponse, successResponse } from '@/lib/auth.js';

// Default presets per persona
const PERSONA_PRESETS = {
  DOCTOR: {
    specialty: 'Clinical & Restorative Dentistry, Healthcare',
    departmentSegments: {
      work: ['Clinical Cases & Surgery', 'Patient Consultations', 'Clinic Management', 'Emergency Procedures'],
      studies: ['Board Exams & Mocks', 'Evidence-Based Research', 'Continuing Medical Education (CME)'],
      finance: ['Clinical Revenue', 'Equipment & Materials', 'Private Practice Overhead', 'Investments'],
      fitness: ['Ergonomic Posture & Mobility', 'Strength & Core Conditioning', 'Cardio & Stamina'],
      roadmap: ['Clinical Mastery', 'Clinic Scaling & Ownership', 'Academic Fellowships', 'Financial Independence']
    }
  },
  DEVELOPER: {
    specialty: 'Full-Stack Software Engineering, Cloud Architecture',
    departmentSegments: {
      work: ['Feature Development', 'Code Reviews & PRs', 'Architecture & System Design', 'Bug Fixes & Refactoring'],
      studies: ['Data Structures & Algorithms', 'System Design & Distributed Systems', 'New Frameworks & AI Tools'],
      finance: ['Tech Salary / Contracting', 'SaaS Subscriptions & Cloud Infra', 'Tech Equity & Stock Portfolio'],
      fitness: ['Desk Posture & Spine Mobility', 'Compound Lifts & Strength', 'Cardio & Focus Recovery'],
      roadmap: ['Staff/Principal Engineer Track', 'Open-Source & SaaS Launches', 'Tech Stack Mastery', 'Net Worth Milestones']
    }
  },
  ENGINEER: {
    specialty: 'Structural / Civil & Mechanical Engineering',
    departmentSegments: {
      work: ['CAD Modeling & Blueprints', 'Site Inspections & Field Audits', 'Vendor & Contractor Coordination', 'Quality Control & Calculations'],
      studies: ['PE / FE Licensure Prep', 'Standard Building Codes (IBC/ASCE)', 'Advanced Simulation Tools'],
      finance: ['Project Contracting', 'Equipment & Software Licenses', 'Retirement & Real Estate Assets'],
      fitness: ['Functional Mobility', 'Strength Training', 'Field Stamina'],
      roadmap: ['Chartered Engineer / PE Certification', 'Consultancy Leadership', 'Infrastructure Projects', 'Asset Building']
    }
  },
  TRADER: {
    specialty: 'US Equities, Futures & Systematic Prop Trading',
    departmentSegments: {
      work: ['Pre-Market Preparation', 'Live Execution & Tape Reading', 'Post-Market Trade Journaling', 'Risk & Position Sizing'],
      studies: ['Market Auction Theory', 'Order Flow & Volume Profiling', 'Macroeconomics & Fed Policy'],
      finance: ['Prop Firm Payouts', 'Margin & Brokerage Capital', 'Physical Gold & Sovereign Reserves', 'Passive Index Holdings'],
      fitness: ['Stress Management & Breathwork', 'Zone 2 Cardio for Mental Clarity', 'Resistance Training'],
      roadmap: ['Funded Account Milestones ($500k+)', 'Consistent Monthly Sharpe > 2.0', 'Family Wealth Preservation', 'Physical Asset Vault']
    }
  },
  STUDENT: {
    specialty: 'Undergraduate / Graduate Academic Studies',
    departmentSegments: {
      work: ['Coursework & Problem Sets', 'Lab Reports & Assignments', 'Internship & Research Projects'],
      studies: ['Active Recall & Anki Flashcards', 'Past Paper Practice & Midterms', 'Final Exam Mastery'],
      finance: ['Student Budget & Living Expenses', 'Scholarships & Grants', 'Savings Buffer'],
      fitness: ['Daily Campus Walks & Cardio', 'Gym Routine for Focus', 'Sleep Optimization'],
      roadmap: ['High GPA / First-Class Honors', 'Top Graduate Admissions', 'Industry Internship', 'Financial Self-Reliance']
    }
  },
  ENTREPRENEUR: {
    specialty: 'Venture Building, Growth Marketing & Product',
    departmentSegments: {
      work: ['Product Strategy & Roadmap', 'Sales & Customer Acquisition', 'Hiring & Team Leadership', 'Operations & Legal'],
      studies: ['Market Trends & Competitor Intel', 'Leadership & Negotiations', 'Capital Allocation & Unit Economics'],
      finance: ['Gross Revenue & MRR', 'Operating Runway & Burn Rate', 'Angel Investments & Dividends'],
      fitness: ['High-Performance Energy Protocols', 'Weight Training', 'Deep Sleep & Recovery'],
      roadmap: ['Product-Market Fit ($10k MRR)', 'Scale to $1M ARR', 'Enterprise Partnerships', 'Generational Freedom']
    }
  }
};

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse('Unauthorized session.', 401);
    }

    const body = await req.json();
    const { persona, experienceLevel, specialty, primaryFocus, currency, departmentSegments } = body;

    const selectedPersona = persona ? persona.toUpperCase() : 'DOCTOR';
    const defaultPreset = PERSONA_PRESETS[selectedPersona] || PERSONA_PRESETS.DOCTOR;

    const finalSegments = departmentSegments || defaultPreset.departmentSegments;
    const finalSpecialty = specialty || defaultPreset.specialty;

    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        persona: selectedPersona,
        experienceLevel: experienceLevel || 'Senior / Specialist',
        specialty: finalSpecialty,
        primaryFocus: primaryFocus || `Excellence in ${selectedPersona}`,
        currency: currency || 'USD',
        departmentSegments: finalSegments,
        onboardingCompleted: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
        persona: true,
        experienceLevel: true,
        specialty: true,
        primaryFocus: true,
        currency: true,
        departmentSegments: true,
        onboardingCompleted: true
      }
    });

    return successResponse({
      message: 'Onboarding completed successfully! Dashboard personalized.',
      user: updatedUser
    });
  } catch (err) {
    console.error('Onboarding setup error:', err);
    return errorResponse('Failed to save onboarding settings.', 500);
  }
}
