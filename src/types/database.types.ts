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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string
          address_type: Database["public"]["Enums"]["address_type"]
          business_id: string | null
          commune_name: string
          created_at: string
          id: string
          is_default: boolean
          postal_code: string | null
          recipient_name: string
          recipient_phone: string
          recipient_phone_secondary: string | null
          title: string
          updated_at: string
          user_id: string | null
          wilaya_code: number
          wilaya_name: string
        }
        Insert: {
          address_line: string
          address_type?: Database["public"]["Enums"]["address_type"]
          business_id?: string | null
          commune_name: string
          created_at?: string
          id?: string
          is_default?: boolean
          postal_code?: string | null
          recipient_name: string
          recipient_phone: string
          recipient_phone_secondary?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
          wilaya_code: number
          wilaya_name: string
        }
        Update: {
          address_line?: string
          address_type?: Database["public"]["Enums"]["address_type"]
          business_id?: string | null
          commune_name?: string
          created_at?: string
          id?: string
          is_default?: boolean
          postal_code?: string | null
          recipient_name?: string
          recipient_phone?: string
          recipient_phone_secondary?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
          wilaya_code?: number
          wilaya_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string
          actor_id: string | null
          actor_role: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email: string
          actor_id?: string | null
          actor_role: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_pricing_tiers: {
        Row: {
          created_at: string
          default_discount_percentage: number
          id: string
          minimum_monthly_volume_dzd: number
          tier_code: string
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_discount_percentage?: number
          id?: string
          minimum_monthly_volume_dzd?: number
          tier_code: string
          tier_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_discount_percentage?: number
          id?: string
          minimum_monthly_volume_dzd?: number
          tier_code?: string
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      b2b_tier_prices: {
        Row: {
          created_at: string
          id: string
          min_quantity: number
          price_dzd: number
          product_id: string
          tier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_quantity?: number
          price_dzd: number
          product_id: string
          tier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_quantity?: number
          price_dzd?: number
          product_id?: string
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "b2b_tier_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_tier_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_tier_prices_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "b2b_pricing_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          is_primary_contact: boolean
          role_in_business: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          role_in_business?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          role_in_business?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address_line: string | null
          article_imposition: string | null
          commune_name: string
          created_at: string
          credit_limit_dzd: number
          current_balance_dzd: number
          document_urls: string[] | null
          email: string | null
          id: string
          name: string
          nif: string | null
          nis: string | null
          notes: string | null
          payment_terms: string
          phone: string
          rc_number: string | null
          status: Database["public"]["Enums"]["b2b_status"]
          tier_code: string
          trade_name: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          wilaya_code: number
          wilaya_name: string
        }
        Insert: {
          address_line?: string | null
          article_imposition?: string | null
          commune_name: string
          created_at?: string
          credit_limit_dzd?: number
          current_balance_dzd?: number
          document_urls?: string[] | null
          email?: string | null
          id?: string
          name: string
          nif?: string | null
          nis?: string | null
          notes?: string | null
          payment_terms?: string
          phone: string
          rc_number?: string | null
          status?: Database["public"]["Enums"]["b2b_status"]
          tier_code?: string
          trade_name?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          wilaya_code: number
          wilaya_name: string
        }
        Update: {
          address_line?: string | null
          article_imposition?: string | null
          commune_name?: string
          created_at?: string
          credit_limit_dzd?: number
          current_balance_dzd?: number
          document_urls?: string[] | null
          email?: string | null
          id?: string
          name?: string
          nif?: string | null
          nis?: string | null
          notes?: string | null
          payment_terms?: string
          phone?: string
          rc_number?: string | null
          status?: Database["public"]["Enums"]["b2b_status"]
          tier_code?: string
          trade_name?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          wilaya_code?: number
          wilaya_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_providers: {
        Row: {
          code: string
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_specific_prices: {
        Row: {
          business_id: string | null
          created_at: string
          custom_price_dzd: number
          id: string
          notes: string | null
          product_id: string
          user_id: string | null
          valid_until: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          custom_price_dzd: number
          id?: string
          notes?: string | null
          product_id: string
          user_id?: string | null
          valid_until?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          custom_price_dzd?: number
          id?: string
          notes?: string | null
          product_id?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_specific_prices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_specific_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_specific_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_specific_prices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          barcode: string | null
          cod_amount_dzd: number
          courier_code: string
          created_at: string
          delivered_at: string | null
          dispatched_at: string | null
          id: string
          label_url: string | null
          order_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          tracking_history: Json
          tracking_number: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          cod_amount_dzd?: number
          courier_code?: string
          created_at?: string
          delivered_at?: string | null
          dispatched_at?: string | null
          id?: string
          label_url?: string | null
          order_id: string
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_history?: Json
          tracking_number: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          cod_amount_dzd?: number
          courier_code?: string
          created_at?: string
          delivered_at?: string | null
          dispatched_at?: string | null
          id?: string
          label_url?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_history?: Json
          tracking_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_rate_matrix: {
        Row: {
          courier_code: string
          created_at: string
          estimated_days_max: number
          estimated_days_min: number
          free_shipping_threshold_dzd: number | null
          home_delivery_dzd: number
          id: string
          is_available: boolean
          stopdesk_delivery_dzd: number
          updated_at: string
          wilaya_code: number
        }
        Insert: {
          courier_code?: string
          created_at?: string
          estimated_days_max?: number
          estimated_days_min?: number
          free_shipping_threshold_dzd?: number | null
          home_delivery_dzd?: number
          id?: string
          is_available?: boolean
          stopdesk_delivery_dzd?: number
          updated_at?: string
          wilaya_code: number
        }
        Update: {
          courier_code?: string
          created_at?: string
          estimated_days_max?: number
          estimated_days_min?: number
          free_shipping_threshold_dzd?: number | null
          home_delivery_dzd?: number
          id?: string
          is_available?: boolean
          stopdesk_delivery_dzd?: number
          updated_at?: string
          wilaya_code?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_rate_matrix_wilaya_code_fkey"
            columns: ["wilaya_code"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["code"]
          },
        ]
      }
      device_models: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          model_code: string | null
          name: string
          release_year: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          model_code?: string | null
          name: string
          release_year?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          model_code?: string | null
          name?: string
          release_year?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_rows: number
          error_rows: number
          errors_summary: Json
          file_name: string
          file_url: string | null
          id: string
          import_type: string
          status: string
          total_rows: number
          updated_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_rows?: number
          error_rows?: number
          errors_summary?: Json
          file_name: string
          file_url?: string | null
          id?: string
          import_type?: string
          status?: string
          total_rows?: number
          updated_rows?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_rows?: number
          error_rows?: number
          errors_summary?: Json
          file_name?: string
          file_url?: string | null
          id?: string
          import_type?: string
          status?: string
          total_rows?: number
          updated_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_reserved: number
          new_stock: number
          notes: string | null
          previous_reserved: number
          previous_stock: number
          product_id: string
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
          warehouse_bin: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_reserved: number
          new_stock: number
          notes?: string | null
          previous_reserved: number
          previous_stock: number
          product_id: string
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
          warehouse_bin?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_reserved?: number
          new_stock?: number
          notes?: string | null
          previous_reserved?: number
          previous_stock?: number
          product_id?: string
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: Database["public"]["Enums"]["inventory_transaction_type"]
          warehouse_bin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_type_snapshot:
            | Database["public"]["Enums"]["product_type"]
            | null
          quantity: number
          sku: string
          total_price_dzd: number
          unit_price_dzd: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_type_snapshot?:
            | Database["public"]["Enums"]["product_type"]
            | null
          quantity: number
          sku: string
          total_price_dzd: number
          unit_price_dzd: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_type_snapshot?:
            | Database["public"]["Enums"]["product_type"]
            | null
          quantity?: number
          sku?: string
          total_price_dzd?: number
          unit_price_dzd?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["order_status"]
          order_id: string
          previous_status: Database["public"]["Enums"]["order_status"] | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["order_status"]
          order_id: string
          previous_status?: Database["public"]["Enums"]["order_status"] | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"]
          order_id?: string
          previous_status?: Database["public"]["Enums"]["order_status"] | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string | null
          commune_name: string
          courier_code: string | null
          created_at: string
          customer_id: string | null
          customer_notes: string | null
          customer_type: Database["public"]["Enums"]["user_type"]
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          discount_dzd: number
          id: string
          internal_notes: string | null
          is_guest: boolean
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          recipient_name: string
          recipient_phone: string
          recipient_phone_secondary: string | null
          shipping_address_line: string
          shipping_cost_dzd: number
          status: Database["public"]["Enums"]["order_status"]
          stopdesk_code: string | null
          subtotal_dzd: number
          total_dzd: number
          tracking_number: string | null
          tracking_token: string
          updated_at: string
          wilaya_code: number
          wilaya_name: string
        }
        Insert: {
          business_id?: string | null
          commune_name: string
          courier_code?: string | null
          created_at?: string
          customer_id?: string | null
          customer_notes?: string | null
          customer_type?: Database["public"]["Enums"]["user_type"]
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          discount_dzd?: number
          id?: string
          internal_notes?: string | null
          is_guest?: boolean
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          recipient_name: string
          recipient_phone: string
          recipient_phone_secondary?: string | null
          shipping_address_line: string
          shipping_cost_dzd?: number
          status?: Database["public"]["Enums"]["order_status"]
          stopdesk_code?: string | null
          subtotal_dzd: number
          total_dzd: number
          tracking_number?: string | null
          tracking_token?: string
          updated_at?: string
          wilaya_code: number
          wilaya_name: string
        }
        Update: {
          business_id?: string | null
          commune_name?: string
          courier_code?: string | null
          created_at?: string
          customer_id?: string | null
          customer_notes?: string | null
          customer_type?: Database["public"]["Enums"]["user_type"]
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          discount_dzd?: number
          id?: string
          internal_notes?: string | null
          is_guest?: boolean
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          recipient_name?: string
          recipient_phone?: string
          recipient_phone_secondary?: string | null
          shipping_address_line?: string
          shipping_cost_dzd?: number
          status?: Database["public"]["Enums"]["order_status"]
          stopdesk_code?: string | null
          subtotal_dzd?: number
          total_dzd?: number
          tracking_number?: string | null
          tracking_token?: string
          updated_at?: string
          wilaya_code?: number
          wilaya_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_dzd: number
          created_at: string
          gateway_response: Json | null
          id: string
          order_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          receipt_url: string | null
          transaction_reference: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_dzd: number
          created_at?: string
          gateway_response?: Json | null
          id?: string
          order_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          receipt_url?: string | null
          transaction_reference?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_dzd?: number
          created_at?: string
          gateway_response?: Json | null
          id?: string
          order_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          receipt_url?: string | null
          transaction_reference?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          code: string
          created_at: string
          description: string | null
          id: string
          resource: string
        }
        Insert: {
          action: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          resource: string
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          resource?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          bulk_batch_id: string | null
          change_reason: string
          changed_by: string | null
          created_at: string
          id: string
          new_price_dzd: number
          old_price_dzd: number
          price_type: string
          product_id: string
          tier_id: string | null
        }
        Insert: {
          bulk_batch_id?: string | null
          change_reason: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_price_dzd: number
          old_price_dzd: number
          price_type: string
          product_id: string
          tier_id?: string | null
        }
        Update: {
          bulk_batch_id?: string | null
          change_reason?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_price_dzd?: number
          old_price_dzd?: number
          price_type?: string
          product_id?: string
          tier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "b2b_pricing_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_compatibility: {
        Row: {
          created_at: string
          device_model_id: string
          id: string
          notes: string | null
          product_id: string
          variant_codes: string[]
        }
        Insert: {
          created_at?: string
          device_model_id: string
          id?: string
          notes?: string | null
          product_id: string
          variant_codes?: string[]
        }
        Update: {
          created_at?: string
          device_model_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          variant_codes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "product_compatibility_device_model_id_fkey"
            columns: ["device_model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compatibility_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compatibility_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_cover: boolean
          product_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_cover?: boolean
          product_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_cover?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          author_name: string
          city: string | null
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          is_verified_purchase: boolean
          order_id: string | null
          product_id: string
          rating: number
          user_id: string | null
        }
        Insert: {
          author_name: string
          city?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          order_id?: string | null
          product_id: string
          rating: number
          user_id?: string | null
        }
        Update: {
          author_name?: string
          city?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_verified_purchase?: boolean
          order_id?: string | null
          product_id?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available_stock: number | null
          b2b_price_dzd: number
          b2c_price_dzd: number
          b2c_sale_price_dzd: number | null
          barcode: string | null
          brand_id: string
          category_id: string
          compatibility: Json
          cost_price_dzd: number
          created_at: string
          description: string | null
          dimensions_cm: Json | null
          gallery: string[]
          id: string
          is_featured: boolean
          is_visible: boolean
          low_stock_threshold: number
          main_image: string
          name: string
          primary_supplier_id: string | null
          product_type: Database["public"]["Enums"]["product_type"]
          reserved_stock: number
          search_vector: unknown
          short_description: string | null
          sku: string
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number
          supplier_sku: string | null
          updated_at: string
          weight_grams: number
        }
        Insert: {
          available_stock?: number | null
          b2b_price_dzd: number
          b2c_price_dzd: number
          b2c_sale_price_dzd?: number | null
          barcode?: string | null
          brand_id: string
          category_id: string
          compatibility?: Json
          cost_price_dzd: number
          created_at?: string
          description?: string | null
          dimensions_cm?: Json | null
          gallery?: string[]
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          low_stock_threshold?: number
          main_image: string
          name: string
          primary_supplier_id?: string | null
          product_type?: Database["public"]["Enums"]["product_type"]
          reserved_stock?: number
          search_vector?: unknown
          short_description?: string | null
          sku: string
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          supplier_sku?: string | null
          updated_at?: string
          weight_grams?: number
        }
        Update: {
          available_stock?: number | null
          b2b_price_dzd?: number
          b2c_price_dzd?: number
          b2c_sale_price_dzd?: number | null
          barcode?: string | null
          brand_id?: string
          category_id?: string
          compatibility?: Json
          cost_price_dzd?: number
          created_at?: string
          description?: string | null
          dimensions_cm?: Json | null
          gallery?: string[]
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          low_stock_threshold?: number
          main_image?: string
          name?: string
          primary_supplier_id?: string | null
          product_type?: Database["public"]["Enums"]["product_type"]
          reserved_stock?: number
          search_vector?: unknown
          short_description?: string | null
          sku?: string
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          supplier_sku?: string | null
          updated_at?: string
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_primary_supplier_id_fkey"
            columns: ["primary_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          phone: string | null
          phone_secondary: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          metadata?: Json | null
          phone?: string | null
          phone_secondary?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          phone?: string | null
          phone_secondary?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_notified: boolean
          notified_at: string | null
          phone: string | null
          product_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_notified?: boolean
          notified_at?: string | null
          phone?: string | null
          product_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_notified?: boolean
          notified_at?: string | null
          phone?: string | null
          product_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          cost_price_dzd: number
          cost_price_foreign: number
          foreign_currency: string
          id: string
          is_primary: boolean
          last_synced_at: string
          moq: number
          product_id: string
          supplier_id: string
          supplier_product_name: string | null
          supplier_sku: string
        }
        Insert: {
          cost_price_dzd: number
          cost_price_foreign: number
          foreign_currency: string
          id?: string
          is_primary?: boolean
          last_synced_at?: string
          moq?: number
          product_id: string
          supplier_id: string
          supplier_product_name?: string | null
          supplier_sku: string
        }
        Update: {
          cost_price_dzd?: number
          cost_price_foreign?: number
          foreign_currency?: string
          id?: string
          is_primary?: boolean
          last_synced_at?: string
          moq?: number
          product_id?: string
          supplier_id?: string
          supplier_product_name?: string | null
          supplier_sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          code: string
          contact_person: string | null
          country: string
          created_at: string
          currency: string
          email: string | null
          exchange_rate_to_dzd: number
          id: string
          is_active: boolean
          lead_time_days: number
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          code: string
          contact_person?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string | null
          exchange_rate_to_dzd?: number
          id?: string
          is_active?: boolean
          lead_time_days?: number
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          contact_person?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string | null
          exchange_rate_to_dzd?: number
          id?: string
          is_active?: boolean
          lead_time_days?: number
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempt_count: number
          created_at: string
          error_message: string | null
          event_type: string
          external_event_id: string | null
          id: string
          payload: Json
          payload_hash: string
          processed_at: string | null
          processing_status: string
          provider: string
          received_at: string
          shipment_id: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          error_message?: string | null
          event_type: string
          external_event_id?: string | null
          id?: string
          payload: Json
          payload_hash: string
          processed_at?: string | null
          processing_status?: string
          provider: string
          received_at?: string
          shipment_id?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          error_message?: string | null
          event_type?: string
          external_event_id?: string | null
          id?: string
          payload?: Json
          payload_hash?: string
          processed_at?: string | null
          processing_status?: string
          provider?: string
          received_at?: string
          shipment_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wilayas: {
        Row: {
          code: number
          created_at: string
          is_active: boolean
          name_ar: string
          name_fr: string
          zone: string
        }
        Insert: {
          code: number
          created_at?: string
          is_active?: boolean
          name_ar: string
          name_fr: string
          zone?: string
        }
        Update: {
          code?: number
          created_at?: string
          is_active?: boolean
          name_ar?: string
          name_fr?: string
          zone?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_products: {
        Row: {
          available_stock: number | null
          b2b_price_dzd: number | null
          b2c_price_dzd: number | null
          b2c_sale_price_dzd: number | null
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          compatibility: Json | null
          created_at: string | null
          description: string | null
          dimensions_cm: Json | null
          gallery: string[] | null
          id: string | null
          is_featured: boolean | null
          is_visible: boolean | null
          low_stock_threshold: number | null
          main_image: string | null
          name: string | null
          product_type: Database["public"]["Enums"]["product_type"] | null
          reserved_stock: number | null
          short_description: string | null
          sku: string | null
          slug: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          stock_quantity: number | null
          updated_at: string | null
          weight_grams: number | null
        }
        Insert: {
          available_stock?: number | null
          b2b_price_dzd?: number | null
          b2c_price_dzd?: number | null
          b2c_sale_price_dzd?: number | null
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          compatibility?: Json | null
          created_at?: string | null
          description?: string | null
          dimensions_cm?: Json | null
          gallery?: string[] | null
          id?: string | null
          is_featured?: boolean | null
          is_visible?: boolean | null
          low_stock_threshold?: number | null
          main_image?: string | null
          name?: string | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          reserved_stock?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          stock_quantity?: number | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Update: {
          available_stock?: number | null
          b2b_price_dzd?: number | null
          b2c_price_dzd?: number | null
          b2c_sale_price_dzd?: number | null
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          compatibility?: Json | null
          created_at?: string | null
          description?: string | null
          dimensions_cm?: Json | null
          gallery?: string[] | null
          id?: string | null
          is_featured?: boolean | null
          is_visible?: boolean | null
          low_stock_threshold?: number | null
          main_image?: string | null
          name?: string | null
          product_type?: Database["public"]["Enums"]["product_type"] | null
          reserved_stock?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          stock_quantity?: number | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_guest_order_tracking: {
        Args: {
          p_order_number: string
          p_phone: string
          p_tracking_token?: string
        }
        Returns: {
          commune_name: string
          courier_code: string
          created_at: string
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          item_count: number
          order_number: string
          recipient_masked_name: string
          status: Database["public"]["Enums"]["order_status"]
          total_dzd: number
          tracking_number: string
          wilaya_name: string
        }[]
      }
      get_user_business_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      has_permission: { Args: { required_perm: string }; Returns: boolean }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      is_staff: { Args: never; Returns: boolean }
      reserve_order_stock: { Args: { p_order_id: string }; Returns: boolean }
      search_products_instant: {
        Args: {
          filter_brand_id?: string
          filter_category_id?: string
          max_results?: number
          search_query: string
        }
        Returns: {
          available_stock: number
          b2c_price: number
          b2c_sale_price: number
          barcode: string
          id: string
          main_image: string
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          relevance_score: number
          sku: string
          slug: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      address_type: "HOME" | "WORK" | "WORKSHOP" | "OTHER"
      b2b_status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
      delivery_status:
        | "PENDING"
        | "PICKED_UP"
        | "IN_TRANSIT"
        | "OUT_FOR_DELIVERY"
        | "DELIVERED"
        | "FAILED"
        | "RETURNED"
        | "CANCELLED"
      delivery_type: "HOME" | "DESK"
      inventory_transaction_type:
        | "RECEIVING"
        | "RESERVATION"
        | "RESERVATION_RELEASE"
        | "FULFILLMENT_OUT"
        | "MANUAL_ADJUSTMENT"
        | "DAMAGED_WRITEOFF"
        | "CUSTOMER_RETURN_RESTOCK"
        | "SUPPLIER_RETURN"
      notification_channel: "SMS" | "WHATSAPP" | "EMAIL" | "IN_APP"
      notification_status: "PENDING" | "SENT" | "DELIVERED" | "FAILED"
      order_status:
        | "PENDING"
        | "CONFIRMED"
        | "PROCESSING"
        | "READY_FOR_SHIPMENT"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED"
        | "FAILED"
        | "RETURNED"
        | "REFUNDED"
      payment_method:
        | "CASH_ON_DELIVERY"
        | "CIB_EDAHABIA"
        | "BANK_TRANSFER"
        | "B2B_CREDIT_ACCOUNT"
      payment_status:
        | "UNPAID"
        | "AUTHORIZED"
        | "PAID"
        | "PARTIALLY_REFUNDED"
        | "REFUNDED"
        | "FAILED"
      product_status: "ACTIVE" | "DRAFT" | "ARCHIVED" | "DISCONTINUED"
      product_type:
        | "OEM_ORIGINAL"
        | "SERVICE_PACK"
        | "REFURBISHED"
        | "HIGH_COPY"
        | "AFTERMARKET"
        | "ACCESSORY"
        | "TOOL"
      user_type: "B2C" | "B2B" | "STAFF"
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
      address_type: ["HOME", "WORK", "WORKSHOP", "OTHER"],
      b2b_status: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
      delivery_status: [
        "PENDING",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
        "RETURNED",
        "CANCELLED",
      ],
      delivery_type: ["HOME", "DESK"],
      inventory_transaction_type: [
        "RECEIVING",
        "RESERVATION",
        "RESERVATION_RELEASE",
        "FULFILLMENT_OUT",
        "MANUAL_ADJUSTMENT",
        "DAMAGED_WRITEOFF",
        "CUSTOMER_RETURN_RESTOCK",
        "SUPPLIER_RETURN",
      ],
      notification_channel: ["SMS", "WHATSAPP", "EMAIL", "IN_APP"],
      notification_status: ["PENDING", "SENT", "DELIVERED", "FAILED"],
      order_status: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "READY_FOR_SHIPMENT",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "FAILED",
        "RETURNED",
        "REFUNDED",
      ],
      payment_method: [
        "CASH_ON_DELIVERY",
        "CIB_EDAHABIA",
        "BANK_TRANSFER",
        "B2B_CREDIT_ACCOUNT",
      ],
      payment_status: [
        "UNPAID",
        "AUTHORIZED",
        "PAID",
        "PARTIALLY_REFUNDED",
        "REFUNDED",
        "FAILED",
      ],
      product_status: ["ACTIVE", "DRAFT", "ARCHIVED", "DISCONTINUED"],
      product_type: [
        "OEM_ORIGINAL",
        "SERVICE_PACK",
        "REFURBISHED",
        "HIGH_COPY",
        "AFTERMARKET",
        "ACCESSORY",
        "TOOL",
      ],
      user_type: ["B2C", "B2B", "STAFF"],
    },
  },
} as const


// Enum Aliases
export type ProductType = Database['public']['Enums']['product_type'];
export type ProductStatus = Database['public']['Enums']['product_status'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type DeliveryType = Database['public']['Enums']['delivery_type'];
export type DeliveryStatus = Database['public']['Enums']['delivery_status'];
export type InventoryTransactionType = Database['public']['Enums']['inventory_transaction_type'];
export type UserType = Database['public']['Enums']['user_type'];
export type B2BStatus = Database['public']['Enums']['b2b_status'];
export type AddressType = Database['public']['Enums']['address_type'];
export type NotificationChannel = Database['public']['Enums']['notification_channel'];
export type NotificationStatus = Database['public']['Enums']['notification_status'];

// Table Aliases
export type Product = Tables<'products'>;
export type Brand = Tables<'brands'>;
export type Category = Tables<'categories'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type Profile = Tables<'profiles'>;
export type Address = Tables<'addresses'>;
export type Business = Tables<'businesses'>;
export type Delivery = Tables<'deliveries'>;
export type DeliveryRate = Tables<'delivery_rate_matrix'>;
export type Wilaya = Tables<'wilayas'>;
export type Cart = Tables<'carts'>;
export type CartItem = Tables<'cart_items'>;
export type StockAlert = Tables<'stock_alerts'>;
export type ImportJob = Tables<'import_jobs'>;
export type ProductReview = Tables<'product_reviews'>;
export type WebhookEvent = Tables<'webhook_events'>;
