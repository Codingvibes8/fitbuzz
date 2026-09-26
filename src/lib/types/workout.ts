export type Workout = {
  id: string;
  title: string;
  category: string;
  duration: number;
  volume: number;
  date: string;
};

export type NewWorkout = Omit<Workout, "id">;