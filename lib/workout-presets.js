/**
 * Standard Workout Presets and Starter Programs
 */

export const WORKOUT_PRESETS = {
  curated_6day: {
    id: 'curated_6day',
    name: '6-Day Hypertrophy Split (Push / Pull / Legs)',
    activeDays: 6,
    restDays: 1,
    splits: [
      {
        dayName: 'Saturday',
        muscleGroup: 'Chest & Triceps (Push A)',
        order: 1,
        isRestDay: false,
        exercises: [
          { name: 'Barbell Flat Bench Press', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '8-10', order: 2 },
          { name: 'Cable Chest Flyes', targetSets: 3, targetReps: '12-15', order: 3 },
          { name: 'Overhead Tricep Rope Extension', targetSets: 3, targetReps: '10-12', order: 4 },
          { name: 'Tricep Straight Bar Pushdown', targetSets: 3, targetReps: '12-15', order: 5 }
        ]
      },
      {
        dayName: 'Sunday',
        muscleGroup: 'Back & Biceps (Pull A)',
        order: 2,
        isRestDay: false,
        exercises: [
          { name: 'Barbell Bent Over Row', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Lat Pulldown (Wide Grip)', targetSets: 3, targetReps: '8-12', order: 2 },
          { name: 'Seated Cable Row (Close Grip)', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Incline Dumbbell Bicep Curl', targetSets: 3, targetReps: '10-12', order: 4 },
          { name: 'Hammer Curls (Rope / Dumbbell)', targetSets: 3, targetReps: '12-15', order: 5 }
        ]
      },
      {
        dayName: 'Monday',
        muscleGroup: 'Legs & Core (Legs A)',
        order: 3,
        isRestDay: false,
        exercises: [
          { name: 'Barbell Back Squat', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Romanian Deadlift (RDL)', targetSets: 3, targetReps: '8-10', order: 2 },
          { name: 'Leg Press (45 Degree)', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Seated Leg Curl', targetSets: 3, targetReps: '12-15', order: 4 },
          { name: 'Standing Calf Raise', targetSets: 4, targetReps: '15-20', order: 5 }
        ]
      },
      {
        dayName: 'Tuesday',
        muscleGroup: 'Rest & Active Recovery',
        order: 4,
        isRestDay: true,
        exercises: []
      },
      {
        dayName: 'Wednesday',
        muscleGroup: 'Shoulders & Arms (Upper Focus)',
        order: 5,
        isRestDay: false,
        exercises: [
          { name: 'Seated Overhead Dumbbell Press', targetSets: 4, targetReps: '8-10', order: 1 },
          { name: 'Cable Lateral Raise', targetSets: 4, targetReps: '12-15', order: 2 },
          { name: 'Face Pulls (Rear Delts)', targetSets: 3, targetReps: '15-20', order: 3 },
          { name: 'EZ Bar Preacher Curl', targetSets: 3, targetReps: '10-12', order: 4 },
          { name: 'Dips / Skull Crushers', targetSets: 3, targetReps: '10-12', order: 5 }
        ]
      },
      {
        dayName: 'Thursday',
        muscleGroup: 'Legs & Posterior Chain (Legs B)',
        order: 6,
        isRestDay: false,
        exercises: [
          { name: 'Conventional Deadlift', targetSets: 3, targetReps: '5', order: 1 },
          { name: 'Bulgarian Split Squat', targetSets: 3, targetReps: '8-10', order: 2 },
          { name: 'Lying Hamstring Curl', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Leg Extension', targetSets: 3, targetReps: '12-15', order: 4 },
          { name: 'Hanging Leg Raise', targetSets: 3, targetReps: '15', order: 5 }
        ]
      },
      {
        dayName: 'Friday',
        muscleGroup: 'Full Body Conditioning & Core',
        order: 7,
        isRestDay: false,
        exercises: [
          { name: 'Incline Smith Bench Press', targetSets: 3, targetReps: '8-10', order: 1 },
          { name: 'Neutral Grip Pull-ups', targetSets: 3, targetReps: 'AMRAP', order: 2 },
          { name: 'Dumbbell Walking Lunges', targetSets: 3, targetReps: '12/leg', order: 3 },
          { name: 'Ab Wheel Rollout', targetSets: 3, targetReps: '15', order: 4 }
        ]
      }
    ]
  },

  split_5day: {
    id: 'split_5day',
    name: '5-Day Upper / Lower / Push / Pull / Legs Split',
    activeDays: 5,
    restDays: 2,
    splits: [
      {
        dayName: 'Saturday',
        muscleGroup: 'Upper Body Power',
        order: 1,
        isRestDay: false,
        exercises: [
          { name: 'Barbell Flat Bench Press', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Barbell Bent Over Row', targetSets: 4, targetReps: '6-8', order: 2 },
          { name: 'Seated Overhead Dumbbell Press', targetSets: 3, targetReps: '8-10', order: 3 },
          { name: 'Lat Pulldown', targetSets: 3, targetReps: '10-12', order: 4 },
          { name: 'Incline Dumbbell Curl', targetSets: 3, targetReps: '10-12', order: 5 }
        ]
      },
      {
        dayName: 'Sunday',
        muscleGroup: 'Lower Body Strength',
        order: 2,
        isRestDay: false,
        exercises: [
          { name: 'Barbell Back Squat', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Romanian Deadlift (RDL)', targetSets: 3, targetReps: '8-10', order: 2 },
          { name: 'Leg Press', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Calf Raises', targetSets: 4, targetReps: '15', order: 4 }
        ]
      },
      {
        dayName: 'Monday',
        muscleGroup: 'Rest & Recovery',
        order: 3,
        isRestDay: true,
        exercises: []
      },
      {
        dayName: 'Tuesday',
        muscleGroup: 'Chest, Shoulders & Triceps (Push)',
        order: 4,
        isRestDay: false,
        exercises: [
          { name: 'Incline Dumbbell Press', targetSets: 4, targetReps: '8-10', order: 1 },
          { name: 'Cable Lateral Raise', targetSets: 4, targetReps: '12-15', order: 2 },
          { name: 'Dips / Pushdowns', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Cable Chest Flyes', targetSets: 3, targetReps: '12-15', order: 4 }
        ]
      },
      {
        dayName: 'Wednesday',
        muscleGroup: 'Back, Rear Delts & Biceps (Pull)',
        order: 5,
        isRestDay: false,
        exercises: [
          { name: 'Neutral Grip Pull-ups', targetSets: 3, targetReps: '8-10', order: 1 },
          { name: 'Seated Cable Row', targetSets: 3, targetReps: '10-12', order: 2 },
          { name: 'Face Pulls', targetSets: 3, targetReps: '15-20', order: 3 },
          { name: 'EZ Bar Preacher Curl', targetSets: 3, targetReps: '10-12', order: 4 }
        ]
      },
      {
        dayName: 'Thursday',
        muscleGroup: 'Legs Hypertrophy & Core',
        order: 6,
        isRestDay: false,
        exercises: [
          { name: 'Bulgarian Split Squat', targetSets: 3, targetReps: '10/leg', order: 1 },
          { name: 'Lying Leg Curl', targetSets: 3, targetReps: '12-15', order: 2 },
          { name: 'Leg Extension', targetSets: 3, targetReps: '12-15', order: 3 },
          { name: 'Hanging Leg Raise', targetSets: 3, targetReps: '15', order: 4 }
        ]
      },
      {
        dayName: 'Friday',
        muscleGroup: 'Rest & Recovery',
        order: 7,
        isRestDay: true,
        exercises: []
      }
    ]
  },

  split_4day: {
    id: 'split_4day',
    name: '4-Day Upper / Lower Split',
    activeDays: 4,
    restDays: 3,
    splits: [
      {
        dayName: 'Saturday',
        muscleGroup: 'Upper Body A (Chest & Back Focus)',
        order: 1,
        isRestDay: false,
        exercises: [
          { name: 'Barbell Flat Bench Press', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Barbell Row', targetSets: 4, targetReps: '6-8', order: 2 },
          { name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '8-10', order: 3 },
          { name: 'Lat Pulldown', targetSets: 3, targetReps: '10-12', order: 4 },
          { name: 'Bicep & Tricep Superset', targetSets: 3, targetReps: '12', order: 5 }
        ]
      },
      {
        dayName: 'Sunday',
        muscleGroup: 'Lower Body A (Squat & Quad Focus)',
        order: 2,
        isRestDay: false,
        exercises: [
          { name: 'Barbell Back Squat', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Romanian Deadlift (RDL)', targetSets: 3, targetReps: '8-10', order: 2 },
          { name: 'Leg Press', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Standing Calf Raise', targetSets: 4, targetReps: '15', order: 4 }
        ]
      },
      {
        dayName: 'Monday',
        muscleGroup: 'Rest & Active Recovery',
        order: 3,
        isRestDay: true,
        exercises: []
      },
      {
        dayName: 'Tuesday',
        muscleGroup: 'Upper Body B (Shoulders & Arms Focus)',
        order: 4,
        isRestDay: false,
        exercises: [
          { name: 'Overhead Dumbbell Press', targetSets: 4, targetReps: '8-10', order: 1 },
          { name: 'Neutral Grip Pull-ups', targetSets: 3, targetReps: '8-10', order: 2 },
          { name: 'Cable Lateral Raise', targetSets: 4, targetReps: '12-15', order: 3 },
          { name: 'Cable Chest Flyes', targetSets: 3, targetReps: '12-15', order: 4 },
          { name: 'Tricep Rope Extension', targetSets: 3, targetReps: '12', order: 5 }
        ]
      },
      {
        dayName: 'Wednesday',
        muscleGroup: 'Lower Body B (Deadlift & Hamstring Focus)',
        order: 5,
        isRestDay: false,
        exercises: [
          { name: 'Conventional Deadlift', targetSets: 3, targetReps: '5', order: 1 },
          { name: 'Bulgarian Split Squats', targetSets: 3, targetReps: '10/leg', order: 2 },
          { name: 'Lying Leg Curl', targetSets: 3, targetReps: '12-15', order: 3 },
          { name: 'Hanging Leg Raise', targetSets: 3, targetReps: '15', order: 4 }
        ]
      },
      {
        dayName: 'Thursday',
        muscleGroup: 'Rest & Active Recovery',
        order: 6,
        isRestDay: true,
        exercises: []
      },
      {
        dayName: 'Friday',
        muscleGroup: 'Rest & Active Recovery',
        order: 7,
        isRestDay: true,
        exercises: []
      }
    ]
  },

  split_3day: {
    id: 'split_3day',
    name: '3-Day Full Body Split',
    activeDays: 3,
    restDays: 4,
    splits: [
      {
        dayName: 'Saturday',
        muscleGroup: 'Full Body A (Strength Focus)',
        order: 1,
        isRestDay: false,
        exercises: [
          { name: 'Barbell Back Squat', targetSets: 4, targetReps: '6-8', order: 1 },
          { name: 'Barbell Bench Press', targetSets: 4, targetReps: '6-8', order: 2 },
          { name: 'Barbell Row', targetSets: 4, targetReps: '6-8', order: 3 },
          { name: 'Overhead Dumbbell Press', targetSets: 3, targetReps: '8-10', order: 4 },
          { name: 'Hanging Leg Raise', targetSets: 3, targetReps: '15', order: 5 }
        ]
      },
      {
        dayName: 'Sunday',
        muscleGroup: 'Rest & Active Recovery',
        order: 2,
        isRestDay: true,
        exercises: []
      },
      {
        dayName: 'Monday',
        muscleGroup: 'Full Body B (Hypertrophy Focus)',
        order: 3,
        isRestDay: false,
        exercises: [
          { name: 'Romanian Deadlift (RDL)', targetSets: 4, targetReps: '8-10', order: 1 },
          { name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '8-10', order: 2 },
          { name: 'Lat Pulldown (Wide Grip)', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Cable Lateral Raise', targetSets: 4, targetReps: '12-15', order: 4 },
          { name: 'Dumbbell Bicep Curl', targetSets: 3, targetReps: '12', order: 5 }
        ]
      },
      {
        dayName: 'Tuesday',
        muscleGroup: 'Rest & Active Recovery',
        order: 4,
        isRestDay: true,
        exercises: []
      },
      {
        dayName: 'Wednesday',
        muscleGroup: 'Full Body C (Conditioning & Core)',
        order: 5,
        isRestDay: false,
        exercises: [
          { name: 'Leg Press', targetSets: 3, targetReps: '10-12', order: 1 },
          { name: 'Dips / Push-ups', targetSets: 3, targetReps: '12-15', order: 2 },
          { name: 'Seated Cable Row', targetSets: 3, targetReps: '10-12', order: 3 },
          { name: 'Bulgarian Split Squat', targetSets: 3, targetReps: '10/leg', order: 4 },
          { name: 'Ab Wheel Rollout', targetSets: 3, targetReps: '15', order: 5 }
        ]
      },
      {
        dayName: 'Thursday',
        muscleGroup: 'Rest & Active Recovery',
        order: 6,
        isRestDay: true,
        exercises: []
      },
      {
        dayName: 'Friday',
        muscleGroup: 'Rest & Active Recovery',
        order: 7,
        isRestDay: true,
        exercises: []
      }
    ]
  },

  blank: {
    id: 'blank',
    name: 'Start 100% Blank (Custom Routine)',
    activeDays: 0,
    restDays: 7,
    splits: [
      { dayName: 'Saturday', muscleGroup: 'Rest & Recovery', order: 1, isRestDay: true, exercises: [] },
      { dayName: 'Sunday', muscleGroup: 'Rest & Recovery', order: 2, isRestDay: true, exercises: [] },
      { dayName: 'Monday', muscleGroup: 'Rest & Recovery', order: 3, isRestDay: true, exercises: [] },
      { dayName: 'Tuesday', muscleGroup: 'Rest & Recovery', order: 4, isRestDay: true, exercises: [] },
      { dayName: 'Wednesday', muscleGroup: 'Rest & Recovery', order: 5, isRestDay: true, exercises: [] },
      { dayName: 'Thursday', muscleGroup: 'Rest & Recovery', order: 6, isRestDay: true, exercises: [] },
      { dayName: 'Friday', muscleGroup: 'Rest & Recovery', order: 7, isRestDay: true, exercises: [] }
    ]
  }
};
