export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          bio: string | null
          brain_version: string | null
          cost_center: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          deployment_status: Database["public"]["Enums"]["deployment_status"]
          email: string
          employee_code: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          expected_roi: number | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name: string
          id: string
          kind: Database["public"]["Enums"]["employee_kind"]
          knowledge_version: string | null
          kpis: Json
          last_active_at: string | null
          location: string | null
          manager_id: string | null
          metadata: Json
          notes: string | null
          phone: string | null
          priority: Database["public"]["Enums"]["employee_priority"]
          responsibilities: string | null
          revenue_category:
            | Database["public"]["Enums"]["revenue_category"]
            | null
          revenue_category_custom: string | null
          revenue_goal: number | null
          role_title: string | null
          skills: string[]
          status: Database["public"]["Enums"]["employee_status"]
          timezone: string | null
          updated_at: string
          user_id: string | null
          workflow_version: string | null
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          brain_version?: string | null
          cost_center?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          deployment_status?: Database["public"]["Enums"]["deployment_status"]
          email: string
          employee_code: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          expected_roi?: number | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name: string
          id?: string
          kind?: Database["public"]["Enums"]["employee_kind"]
          knowledge_version?: string | null
          kpis?: Json
          last_active_at?: string | null
          location?: string | null
          manager_id?: string | null
          metadata?: Json
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["employee_priority"]
          responsibilities?: string | null
          revenue_category?:
            | Database["public"]["Enums"]["revenue_category"]
            | null
          revenue_category_custom?: string | null
          revenue_goal?: number | null
          role_title?: string | null
          skills?: string[]
          status?: Database["public"]["Enums"]["employee_status"]
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
          workflow_version?: string | null
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          brain_version?: string | null
          cost_center?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          deployment_status?: Database["public"]["Enums"]["deployment_status"]
          email?: string
          employee_code?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          expected_roi?: number | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          full_name?: string
          id?: string
          kind?: Database["public"]["Enums"]["employee_kind"]
          knowledge_version?: string | null
          kpis?: Json
          last_active_at?: string | null
          location?: string | null
          manager_id?: string | null
          metadata?: Json
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["employee_priority"]
          responsibilities?: string | null
          revenue_category?:
            | Database["public"]["Enums"]["revenue_category"]
            | null
          revenue_category_custom?: string | null
          revenue_goal?: number | null
          role_title?: string | null
          skills?: string[]
          status?: Database["public"]["Enums"]["employee_status"]
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
          workflow_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_activity: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json
          user_id: string | null
          workflow_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id?: string | null
          workflow_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_activity_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_assignments: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          role: Database["public"]["Enums"]["workflow_assignment_role"]
          workflow_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          role?: Database["public"]["Enums"]["workflow_assignment_role"]
          workflow_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          role?: Database["public"]["Enums"]["workflow_assignment_role"]
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_assignments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          assigned_employee_id: string | null
          config: Json
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          order_index: number
          step_type: Database["public"]["Enums"]["workflow_step_type"]
          title: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          assigned_employee_id?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          order_index?: number
          step_type?: Database["public"]["Enums"]["workflow_step_type"]
          title: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          assigned_employee_id?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          order_index?: number
          step_type?: Database["public"]["Enums"]["workflow_step_type"]
          title?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          snapshot: Json
          version: number
          workflow_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot: Json
          version: number
          workflow_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot?: Json
          version?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_versions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          category: Database["public"]["Enums"]["workflow_category"]
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          estimated_duration_minutes: number | null
          execution_count: number
          id: string
          last_run_at: string | null
          metadata: Json
          name: string
          owner_id: string | null
          priority: Database["public"]["Enums"]["employee_priority"]
          status: Database["public"]["Enums"]["workflow_status"]
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at: string
          version: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["workflow_category"]
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          execution_count?: number
          id?: string
          last_run_at?: string | null
          metadata?: Json
          name: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["employee_priority"]
          status?: Database["public"]["Enums"]["workflow_status"]
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["workflow_category"]
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          execution_count?: number
          id?: string
          last_run_at?: string | null
          metadata?: Json
          name?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["employee_priority"]
          status?: Database["public"]["Enums"]["workflow_status"]
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["workflow_trigger_type"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflows_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee"
      deployment_status: "draft" | "ready" | "deployed" | "paused" | "error"
      employee_kind: "human" | "ai" | "hybrid"
      employee_priority: "low" | "medium" | "high" | "critical"
      employee_status: "active" | "inactive" | "on_leave" | "archived"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "intern"
        | "consultant"
      experience_level: "junior" | "mid" | "senior" | "lead" | "principal"
      revenue_category:
        | "sales"
        | "marketing"
        | "support"
        | "operations"
        | "research"
        | "custom"
      workflow_assignment_role: "owner" | "assignee" | "reviewer"
      workflow_category:
        | "sales"
        | "marketing"
        | "customer_success"
        | "support"
        | "operations"
        | "finance"
        | "hr"
        | "research"
        | "custom"
      workflow_status: "draft" | "active" | "paused" | "archived"
      workflow_step_type:
        | "task"
        | "approval"
        | "decision"
        | "notification"
        | "delay"
        | "integration"
      workflow_trigger_type:
        | "manual"
        | "schedule"
        | "webhook"
        | "crm_event"
        | "email_event"
        | "customer_event"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "employee"],
      deployment_status: ["draft", "ready", "deployed", "paused", "error"],
      employee_kind: ["human", "ai", "hybrid"],
      employee_priority: ["low", "medium", "high", "critical"],
      employee_status: ["active", "inactive", "on_leave", "archived"],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "intern",
        "consultant",
      ],
      experience_level: ["junior", "mid", "senior", "lead", "principal"],
      revenue_category: [
        "sales",
        "marketing",
        "support",
        "operations",
        "research",
        "custom",
      ],
      workflow_assignment_role: ["owner", "assignee", "reviewer"],
      workflow_category: [
        "sales",
        "marketing",
        "customer_success",
        "support",
        "operations",
        "finance",
        "hr",
        "research",
        "custom",
      ],
      workflow_status: ["draft", "active", "paused", "archived"],
      workflow_step_type: [
        "task",
        "approval",
        "decision",
        "notification",
        "delay",
        "integration",
      ],
      workflow_trigger_type: [
        "manual",
        "schedule",
        "webhook",
        "crm_event",
        "email_event",
        "customer_event",
      ],
    },
  },
} as const
