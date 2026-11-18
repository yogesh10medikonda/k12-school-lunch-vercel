import 'dotenv/config';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Student } from '../src/modules/students/student.model.js';

/**
 * DEV-ONLY demo seed data.
 * Clearly labelled as demo data — NOT for production use.
 * Seeds a few students so the frontend has something to display out of the box.
 */
const DEMO_STUDENTS = [
  {
    name: 'Ava Johnson',
    studentId: 'STU-1001',
    grade: '9',
    class: 'A',
    dateOfBirth: '2011-03-14',
    mealEligibility: 'paid',
    dietaryRestrictions: [],
    allergies: ['Peanuts'],
    status: 'Active',
  },
  {
    name: 'Liam Carter',
    studentId: 'STU-1002',
    grade: '9',
    class: 'B',
    dateOfBirth: '2011-07-22',
    mealEligibility: 'free',
    dietaryRestrictions: ['Vegetarian'],
    allergies: [],
    status: 'Active',
  },
  {
    name: 'Maya Patel',
    studentId: 'STU-1003',
    grade: '10',
    class: 'A',
    dateOfBirth: '2010-11-05',
    mealEligibility: 'reduced',
    dietaryRestrictions: [],
    allergies: ['Shellfish', 'Tree nuts'],
    status: 'Active',
  },
  {
    name: 'Ethan Wright',
    studentId: 'STU-1004',
    grade: '10',
    class: 'B',
    dateOfBirth: '2010-01-18',
    mealEligibility: 'paid',
    dietaryRestrictions: ['Gluten-free'],
    allergies: [],
    status: 'Active',
  },
  {
    name: 'Sophia Kim',
    studentId: 'STU-1005',
    grade: '11',
    class: 'A',
    dateOfBirth: '2009-05-30',
    mealEligibility: 'not_eligible',
    dietaryRestrictions: [],
    allergies: ['Dairy'],
    status: 'Active',
  },
  {
    name: 'Noah Ali',
    studentId: 'STU-1006',
    grade: '11',
    class: 'B',
    dateOfBirth: '2009-09-12',
    mealEligibility: 'free',
    dietaryRestrictions: ['Halal'],
    allergies: [],
    status: 'Inactive',
  },
];

const run = async () => {
  await connectDB();
  try {
    await Student.deleteMany({});
    const inserted = await Student.insertMany(DEMO_STUDENTS, { ordered: false });
    console.log(`🌱 Seeded ${inserted.length} demo students (development only)`);
  } finally {
    await disconnectDB();
  }
};

run().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});