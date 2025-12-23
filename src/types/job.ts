export type JobStatus = 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';

export interface JobApplication {
  id: string;
  user_id: string;
  url: string;
  job_title: string;
  company_name: string;
  status: JobStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface JobInsert {
  url?: string;
  job_title: string;
  company_name: string;
  status?: JobStatus;
  notes?: string;
}

export interface JobUpdate {
  url?: string;
  job_title?: string;
  company_name?: string;
  status?: JobStatus;
  notes?: string;
}

export interface ScrapeResult {
  jobTitle: string;
  companyName: string;
  success: boolean;
  error?: string;
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: JobApplication;
        Insert: JobInsert & { user_id: string };
        Update: JobUpdate;
      };
    };
  };
};
