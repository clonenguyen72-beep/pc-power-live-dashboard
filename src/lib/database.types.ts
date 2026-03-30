export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      pc_power_metrics: {
        Row: {
          id: number;
          time: string;
          uptime_hours: number;
          cpu_percent: number;
          realtime_estimated_w: number;
          avg_w_from_boot: number;
          estimated_kwh_from_boot: number;
          estimated_cost_from_boot_vnd: number;
          rate_per_kwh_vnd: number;
          host: string;
          cpu_name: string | null;
          gpu_name: string | null;
          ram_total_gb: number | null;
          ram_used_gb: number | null;
          disk_total_gb: number | null;
          disk_free_gb: number | null;
          os_name: string | null;
        };
        Insert: {
          id?: number;
          time?: string;
          uptime_hours: number;
          cpu_percent: number;
          realtime_estimated_w: number;
          avg_w_from_boot: number;
          estimated_kwh_from_boot: number;
          estimated_cost_from_boot_vnd: number;
          rate_per_kwh_vnd: number;
          host: string;
          cpu_name?: string | null;
          gpu_name?: string | null;
          ram_total_gb?: number | null;
          ram_used_gb?: number | null;
          disk_total_gb?: number | null;
          disk_free_gb?: number | null;
          os_name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pc_power_metrics"]["Insert"]>;
        Relationships: [];
      };
      pc_power_settings: {
        Row: {
          id: number;
          rate_per_kwh_vnd: number;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          rate_per_kwh_vnd: number;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pc_power_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

