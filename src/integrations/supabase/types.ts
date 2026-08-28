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
      brain_activity: {
        Row: {
          action: string
          brain_id: string
          created_at: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          brain_id: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          brain_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brain_activity_brain_id_fkey"
            columns: ["brain_id"]
            isOneToOne: false
            referencedRelation: "brains"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_analytics_daily: {
        Row: {
          avg_response_ms: number | null
          brain_id: string
          created_at: string
          csat_score: number | null
          day: string
          estimated_roi: number | null
          execution_count: number
          failure_count: number
          id: string
          metadata: Json
          revenue_influence: number | null
          success_count: number
          usage_count: number
        }
        Insert: {
          avg_response_ms?: number | null
          brain_id: string
          created_at?: string
          csat_score?: number | null
          day: string
          estimated_roi?: number | null
          execution_count?: number
          failure_count?: number
          id?: string
          metadata?: Json
          revenue_influence?: number | null
          success_count?: number
          usage_count?: number
        }
        Update: {
          avg_response_ms?: number | null
          brain_id?: string
          created_at?: string
          csat_score?: number | null
          day?: string
          estimated_roi?: number | null
          execution_count?: number
          failure_count?: number
          id?: string
          metadata?: Json
          revenue_influence?: number | null
          success_count?: number
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "brain_analytics_daily_brain_id_fkey"
            columns: ["brain_id"]
            isOneToOne: false
            referencedRelation: "brains"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_assignments: {
        Row: {
          brain_id: string
          created_at: string
          employee_id: string | null
          id: string
          target_type: Database["public"]["Enums"]["brain_assignment_target"]
          workflow_id: string | null
        }
        Insert: {
          brain_id: string
          created_at?: string
          employee_id?: string | null
          id?: string
          target_type: Database["public"]["Enums"]["brain_assignment_target"]
          workflow_id?: string | null
        }
        Update: {
          brain_id?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          target_type?: Database["public"]["Enums"]["brain_assignment_target"]
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brain_assignments_brain_id_fkey"
            columns: ["brain_id"]
            isOneToOne: false
            referencedRelation: "brains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_assignments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_knowledge: {
        Row: {
          brain_id: string
          created_at: string
          knowledge_id: string
        }
        Insert: {
          brain_id: string
          created_at?: string
          knowledge_id: string
        }
        Update: {
          brain_id?: string
          created_at?: string
          knowledge_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_knowledge_brain_id_fkey"
            columns: ["brain_id"]
            isOneToOne: false
            referencedRelation: "brains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_knowledge_knowledge_id_fkey"
            columns: ["knowledge_id"]
            isOneToOne: false
            referencedRelation: "knowledge_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_skills: {
        Row: {
          brain_id: string
          created_at: string
          skill_id: string
        }
        Insert: {
          brain_id: string
          created_at?: string
          skill_id: string
        }
        Update: {
          brain_id?: string
          created_at?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_skills_brain_id_fkey"
            columns: ["brain_id"]
            isOneToOne: false
            referencedRelation: "brains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_templates: {
        Row: {
          author: string | null
          category: Database["public"]["Enums"]["brain_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_official: boolean
          metadata: Json
          name: string
          snapshot: Json
          tags: string[]
          updated_at: string
          usage_count: number
        }
        Insert: {
          author?: string | null
          category?: Database["public"]["Enums"]["brain_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_official?: boolean
          metadata?: Json
          name: string
          snapshot: Json
          tags?: string[]
          updated_at?: string
          usage_count?: number
        }
        Update: {
          author?: string | null
          category?: Database["public"]["Enums"]["brain_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_official?: boolean
          metadata?: Json
          name?: string
          snapshot?: Json
          tags?: string[]
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      brain_tools: {
        Row: {
          brain_id: string
          created_at: string
          permissions: string[]
          tool_id: string
        }
        Insert: {
          brain_id: string
          created_at?: string
          permissions?: string[]
          tool_id: string
        }
        Update: {
          brain_id?: string
          created_at?: string
          permissions?: string[]
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_tools_brain_id_fkey"
            columns: ["brain_id"]
            isOneToOne: false
            referencedRelation: "brains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_tools_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_versions: {
        Row: {
          brain_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          snapshot: Json
          status: Database["public"]["Enums"]["brain_status"]
          version: number
        }
        Insert: {
          brain_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          snapshot: Json
          status?: Database["public"]["Enums"]["brain_status"]
          version: number
        }
        Update: {
          brain_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          snapshot?: Json
          status?: Database["public"]["Enums"]["brain_status"]
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "brain_versions_brain_id_fkey"
            columns: ["brain_id"]
            isOneToOne: false
            referencedRelation: "brains"
            referencedColumns: ["id"]
          },
        ]
      }
      brains: {
        Row: {
          always_do: string[]
          approval_rules: string | null
          avatar_url: string | null
          brain_config: Json
          category: Database["public"]["Enums"]["brain_category"]
          compatibility_version: string
          context_window_tokens: number
          created_at: string
          created_by: string | null
          creativity_level: number
          decision_style: Database["public"]["Enums"]["brain_decision_style"]
          description: string | null
          escalation_rules: string | null
          expected_roi: number | null
          goals: string[]
          id: string
          kpis: Json
          long_term_memory_enabled: boolean
          marketplace_author: string | null
          marketplace_dependencies: Json
          marketplace_install_metadata: Json
          marketplace_license:
            | Database["public"]["Enums"]["marketplace_license"]
            | null
          marketplace_price: number | null
          marketplace_pricing_model:
            | Database["public"]["Enums"]["marketplace_pricing_model"]
            | null
          marketplace_ready: boolean
          memory_retention_days: number
          mission: string | null
          name: string
          never_do: string[]
          organization_id: string | null
          owner_id: string | null
          response_depth: Database["public"]["Enums"]["brain_response_depth"]
          risk_level: number
          session_memory_enabled: boolean
          status: Database["public"]["Enums"]["brain_status"]
          success_definition: string | null
          tags: string[]
          template_id: string | null
          tone: Database["public"]["Enums"]["brain_tone"]
          updated_at: string
          version: number
          visibility: Database["public"]["Enums"]["brain_visibility"]
        }
        Insert: {
          always_do?: string[]
          approval_rules?: string | null
          avatar_url?: string | null
          brain_config?: Json
          category?: Database["public"]["Enums"]["brain_category"]
          compatibility_version?: string
          context_window_tokens?: number
          created_at?: string
          created_by?: string | null
          creativity_level?: number
          decision_style?: Database["public"]["Enums"]["brain_decision_style"]
          description?: string | null
          escalation_rules?: string | null
          expected_roi?: number | null
          goals?: string[]
          id?: string
          kpis?: Json
          long_term_memory_enabled?: boolean
          marketplace_author?: string | null
          marketplace_dependencies?: Json
          marketplace_install_metadata?: Json
          marketplace_license?:
            | Database["public"]["Enums"]["marketplace_license"]
            | null
          marketplace_price?: number | null
          marketplace_pricing_model?:
            | Database["public"]["Enums"]["marketplace_pricing_model"]
            | null
          marketplace_ready?: boolean
          memory_retention_days?: number
          mission?: string | null
          name: string
          never_do?: string[]
          organization_id?: string | null
          owner_id?: string | null
          response_depth?: Database["public"]["Enums"]["brain_response_depth"]
          risk_level?: number
          session_memory_enabled?: boolean
          status?: Database["public"]["Enums"]["brain_status"]
          success_definition?: string | null
          tags?: string[]
          template_id?: string | null
          tone?: Database["public"]["Enums"]["brain_tone"]
          updated_at?: string
          version?: number
          visibility?: Database["public"]["Enums"]["brain_visibility"]
        }
        Update: {
          always_do?: string[]
          approval_rules?: string | null
          avatar_url?: string | null
          brain_config?: Json
          category?: Database["public"]["Enums"]["brain_category"]
          compatibility_version?: string
          context_window_tokens?: number
          created_at?: string
          created_by?: string | null
          creativity_level?: number
          decision_style?: Database["public"]["Enums"]["brain_decision_style"]
          description?: string | null
          escalation_rules?: string | null
          expected_roi?: number | null
          goals?: string[]
          id?: string
          kpis?: Json
          long_term_memory_enabled?: boolean
          marketplace_author?: string | null
          marketplace_dependencies?: Json
          marketplace_install_metadata?: Json
          marketplace_license?:
            | Database["public"]["Enums"]["marketplace_license"]
            | null
          marketplace_price?: number | null
          marketplace_pricing_model?:
            | Database["public"]["Enums"]["marketplace_pricing_model"]
            | null
          marketplace_ready?: boolean
          memory_retention_days?: number
          mission?: string | null
          name?: string
          never_do?: string[]
          organization_id?: string | null
          owner_id?: string | null
          response_depth?: Database["public"]["Enums"]["brain_response_depth"]
          risk_level?: number
          session_memory_enabled?: boolean
          status?: Database["public"]["Enums"]["brain_status"]
          success_definition?: string | null
          tags?: string[]
          template_id?: string | null
          tone?: Database["public"]["Enums"]["brain_tone"]
          updated_at?: string
          version?: number
          visibility?: Database["public"]["Enums"]["brain_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "brains_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "brain_templates"
            referencedColumns: ["id"]
          },
        ]
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
      knowledge_packs: {
        Row: {
          category: Database["public"]["Enums"]["knowledge_category"]
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          metadata: Json
          name: string
          organization_id: string | null
          owner_id: string | null
          source_type: Database["public"]["Enums"]["knowledge_source_type"]
          source_url: string | null
          status: Database["public"]["Enums"]["knowledge_status"]
          tags: string[]
          updated_at: string
          version: number
          visibility: Database["public"]["Enums"]["brain_visibility"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["knowledge_category"]
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          name: string
          organization_id?: string | null
          owner_id?: string | null
          source_type?: Database["public"]["Enums"]["knowledge_source_type"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["knowledge_status"]
          tags?: string[]
          updated_at?: string
          version?: number
          visibility?: Database["public"]["Enums"]["brain_visibility"]
        }
        Update: {
          category?: Database["public"]["Enums"]["knowledge_category"]
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string | null
          owner_id?: string | null
          source_type?: Database["public"]["Enums"]["knowledge_source_type"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["knowledge_status"]
          tags?: string[]
          updated_at?: string
          version?: number
          visibility?: Database["public"]["Enums"]["brain_visibility"]
        }
        Relationships: []
      }
      knowledge_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          knowledge_id: string
          snapshot: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          knowledge_id: string
          snapshot: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          knowledge_id?: string
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_versions_knowledge_id_fkey"
            columns: ["knowledge_id"]
            isOneToOne: false
            referencedRelation: "knowledge_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_run_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          message: string
          metadata: Json
          mission_id: string
          step_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          message: string
          metadata?: Json
          mission_id: string
          step_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          message?: string
          metadata?: Json
          mission_id?: string
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_run_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_run_events_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "mission_run_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_run_messages: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          mission_id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          mission_id: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          mission_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_run_messages_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_run_steps: {
        Row: {
          capability_available: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          error: string | null
          executor_id: string | null
          executor_kind: Database["public"]["Enums"]["mission_executor_kind"]
          executor_label: string | null
          id: string
          input: Json
          instruction: string | null
          mission_id: string
          order_index: number
          output: Json | null
          requires_approval: boolean
          retry_count: number
          started_at: string | null
          status: Database["public"]["Enums"]["mission_step_status"]
          title: string
          updated_at: string
        }
        Insert: {
          capability_available?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          error?: string | null
          executor_id?: string | null
          executor_kind?: Database["public"]["Enums"]["mission_executor_kind"]
          executor_label?: string | null
          id?: string
          input?: Json
          instruction?: string | null
          mission_id: string
          order_index: number
          output?: Json | null
          requires_approval?: boolean
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["mission_step_status"]
          title: string
          updated_at?: string
        }
        Update: {
          capability_available?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          error?: string | null
          executor_id?: string | null
          executor_kind?: Database["public"]["Enums"]["mission_executor_kind"]
          executor_label?: string | null
          id?: string
          input?: Json
          instruction?: string | null
          mission_id?: string
          order_index?: number
          output?: Json | null
          requires_approval?: boolean
          retry_count?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["mission_step_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_run_steps_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_runs: {
        Row: {
          clarification_question: string | null
          completed_at: string | null
          constraints: Json
          created_at: string
          created_by: string | null
          current_action: string | null
          deadline: string | null
          desired_outcome: string | null
          error: string | null
          id: string
          intent_text: string
          metadata: Json
          objective: string | null
          plan_rationale: string | null
          priority: Database["public"]["Enums"]["employee_priority"]
          progress_percent: number
          result: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["mission_run_status"]
          success_criteria: Json
          summary: string | null
          title: string
          updated_at: string
          verification: Json | null
        }
        Insert: {
          clarification_question?: string | null
          completed_at?: string | null
          constraints?: Json
          created_at?: string
          created_by?: string | null
          current_action?: string | null
          deadline?: string | null
          desired_outcome?: string | null
          error?: string | null
          id?: string
          intent_text: string
          metadata?: Json
          objective?: string | null
          plan_rationale?: string | null
          priority?: Database["public"]["Enums"]["employee_priority"]
          progress_percent?: number
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["mission_run_status"]
          success_criteria?: Json
          summary?: string | null
          title: string
          updated_at?: string
          verification?: Json | null
        }
        Update: {
          clarification_question?: string | null
          completed_at?: string | null
          constraints?: Json
          created_at?: string
          created_by?: string | null
          current_action?: string | null
          deadline?: string | null
          desired_outcome?: string | null
          error?: string | null
          id?: string
          intent_text?: string
          metadata?: Json
          objective?: string | null
          plan_rationale?: string | null
          priority?: Database["public"]["Enums"]["employee_priority"]
          progress_percent?: number
          result?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["mission_run_status"]
          success_criteria?: Json
          summary?: string | null
          title?: string
          updated_at?: string
          verification?: Json | null
        }
        Relationships: []
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
      skills: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at: string
          created_by: string | null
          dependencies: string[]
          description: string | null
          difficulty: Database["public"]["Enums"]["skill_difficulty"]
          id: string
          metadata: Json
          name: string
          required_knowledge: string[]
          required_tools: string[]
          tags: string[]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string
          created_by?: string | null
          dependencies?: string[]
          description?: string | null
          difficulty?: Database["public"]["Enums"]["skill_difficulty"]
          id?: string
          metadata?: Json
          name: string
          required_knowledge?: string[]
          required_tools?: string[]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string
          created_by?: string | null
          dependencies?: string[]
          description?: string | null
          difficulty?: Database["public"]["Enums"]["skill_difficulty"]
          id?: string
          metadata?: Json
          name?: string
          required_knowledge?: string[]
          required_tools?: string[]
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          auth_type: Database["public"]["Enums"]["tool_auth_type"]
          base_url: string | null
          config: Json
          created_at: string
          created_by: string | null
          description: string | null
          environment: Database["public"]["Enums"]["tool_environment"]
          health: Database["public"]["Enums"]["tool_health"]
          icon: string | null
          id: string
          metadata: Json
          name: string
          owner_id: string | null
          permissions: string[]
          provider: string
          runtime_ready: boolean
          scopes: string[]
          status: Database["public"]["Enums"]["tool_status"]
          updated_at: string
        }
        Insert: {
          auth_type?: Database["public"]["Enums"]["tool_auth_type"]
          base_url?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          environment?: Database["public"]["Enums"]["tool_environment"]
          health?: Database["public"]["Enums"]["tool_health"]
          icon?: string | null
          id?: string
          metadata?: Json
          name: string
          owner_id?: string | null
          permissions?: string[]
          provider: string
          runtime_ready?: boolean
          scopes?: string[]
          status?: Database["public"]["Enums"]["tool_status"]
          updated_at?: string
        }
        Update: {
          auth_type?: Database["public"]["Enums"]["tool_auth_type"]
          base_url?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          environment?: Database["public"]["Enums"]["tool_environment"]
          health?: Database["public"]["Enums"]["tool_health"]
          icon?: string | null
          id?: string
          metadata?: Json
          name?: string
          owner_id?: string | null
          permissions?: string[]
          provider?: string
          runtime_ready?: boolean
          scopes?: string[]
          status?: Database["public"]["Enums"]["tool_status"]
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
      can_access_mission_run: {
        Args: { _mission_id: string }
        Returns: boolean
      }
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
      brain_assignment_target: "employee" | "workflow"
      brain_category:
        | "sales"
        | "support"
        | "operations"
        | "marketing"
        | "research"
        | "finance"
        | "growth"
        | "recruitment"
        | "executive"
        | "custom"
      brain_decision_style:
        | "conservative"
        | "balanced"
        | "aggressive"
        | "data_driven"
        | "intuitive"
      brain_response_depth: "brief" | "standard" | "detailed" | "exhaustive"
      brain_status:
        | "draft"
        | "published"
        | "stable"
        | "experimental"
        | "archived"
      brain_tone:
        | "formal"
        | "friendly"
        | "concise"
        | "persuasive"
        | "empathetic"
        | "analytical"
        | "playful"
      brain_visibility: "private" | "organization" | "public"
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
      knowledge_category:
        | "general"
        | "product"
        | "sales"
        | "support"
        | "marketing"
        | "operations"
        | "finance"
        | "hr"
        | "legal"
        | "engineering"
        | "custom"
      knowledge_source_type:
        | "pdf"
        | "docx"
        | "markdown"
        | "text"
        | "faq"
        | "sop"
        | "pricing"
        | "policy"
        | "notes"
        | "url"
      knowledge_status: "draft" | "active" | "archived"
      marketplace_license:
        | "proprietary"
        | "mit"
        | "apache_2"
        | "commercial"
        | "custom"
      marketplace_pricing_model:
        | "free"
        | "one_time"
        | "subscription"
        | "usage_based"
        | "enterprise"
      mission_executor_kind:
        | "ai_brain"
        | "skill"
        | "tool"
        | "workflow"
        | "employee"
        | "human"
        | "system"
      mission_run_status:
        | "planning"
        | "ready"
        | "running"
        | "waiting_for_human"
        | "waiting_for_approval"
        | "blocked"
        | "failed"
        | "completed"
        | "cancelled"
      mission_step_status:
        | "pending"
        | "running"
        | "waiting_for_human"
        | "waiting_for_approval"
        | "blocked"
        | "failed"
        | "skipped"
        | "completed"
      revenue_category:
        | "sales"
        | "marketing"
        | "support"
        | "operations"
        | "research"
        | "custom"
      skill_category:
        | "sales"
        | "support"
        | "research"
        | "marketing"
        | "recruitment"
        | "operations"
        | "finance"
        | "negotiation"
        | "planning"
        | "analysis"
        | "writing"
        | "translation"
        | "coding"
        | "custom"
      skill_difficulty: "beginner" | "intermediate" | "advanced" | "expert"
      tool_auth_type: "none" | "api_key" | "oauth2" | "basic" | "custom"
      tool_environment: "development" | "staging" | "production"
      tool_health: "unknown" | "healthy" | "degraded" | "down"
      tool_status: "inactive" | "active" | "deprecated"
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
      brain_assignment_target: ["employee", "workflow"],
      brain_category: [
        "sales",
        "support",
        "operations",
        "marketing",
        "research",
        "finance",
        "growth",
        "recruitment",
        "executive",
        "custom",
      ],
      brain_decision_style: [
        "conservative",
        "balanced",
        "aggressive",
        "data_driven",
        "intuitive",
      ],
      brain_response_depth: ["brief", "standard", "detailed", "exhaustive"],
      brain_status: [
        "draft",
        "published",
        "stable",
        "experimental",
        "archived",
      ],
      brain_tone: [
        "formal",
        "friendly",
        "concise",
        "persuasive",
        "empathetic",
        "analytical",
        "playful",
      ],
      brain_visibility: ["private", "organization", "public"],
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
      knowledge_category: [
        "general",
        "product",
        "sales",
        "support",
        "marketing",
        "operations",
        "finance",
        "hr",
        "legal",
        "engineering",
        "custom",
      ],
      knowledge_source_type: [
        "pdf",
        "docx",
        "markdown",
        "text",
        "faq",
        "sop",
        "pricing",
        "policy",
        "notes",
        "url",
      ],
      knowledge_status: ["draft", "active", "archived"],
      marketplace_license: [
        "proprietary",
        "mit",
        "apache_2",
        "commercial",
        "custom",
      ],
      marketplace_pricing_model: [
        "free",
        "one_time",
        "subscription",
        "usage_based",
        "enterprise",
      ],
      mission_executor_kind: [
        "ai_brain",
        "skill",
        "tool",
        "workflow",
        "employee",
        "human",
        "system",
      ],
      mission_run_status: [
        "planning",
        "ready",
        "running",
        "waiting_for_human",
        "waiting_for_approval",
        "blocked",
        "failed",
        "completed",
        "cancelled",
      ],
      mission_step_status: [
        "pending",
        "running",
        "waiting_for_human",
        "waiting_for_approval",
        "blocked",
        "failed",
        "skipped",
        "completed",
      ],
      revenue_category: [
        "sales",
        "marketing",
        "support",
        "operations",
        "research",
        "custom",
      ],
      skill_category: [
        "sales",
        "support",
        "research",
        "marketing",
        "recruitment",
        "operations",
        "finance",
        "negotiation",
        "planning",
        "analysis",
        "writing",
        "translation",
        "coding",
        "custom",
      ],
      skill_difficulty: ["beginner", "intermediate", "advanced", "expert"],
      tool_auth_type: ["none", "api_key", "oauth2", "basic", "custom"],
      tool_environment: ["development", "staging", "production"],
      tool_health: ["unknown", "healthy", "degraded", "down"],
      tool_status: ["inactive", "active", "deprecated"],
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
