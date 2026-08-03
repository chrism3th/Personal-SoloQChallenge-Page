/**
 * Tipos de la base de datos, escritos a mano siguiendo el esquema de
 * supabase/migrations/0001_init.sql. Si el esquema cambia, actualizar
 * este archivo (o reemplazarlo por `supabase gen types typescript` una
 * vez que exista un proyecto Supabase real para generarlo).
 */

export type Tier =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER"
  | "CHALLENGER";

export type Division = "I" | "II" | "III" | "IV" | null;

/** Insert = las columnas realmente NOT NULL sin default son requeridas; el resto queda opcional. */
type InsertOf<Row, RequiredKeys extends keyof Row> = Pick<Row, RequiredKeys> &
  Partial<Omit<Row, RequiredKeys>>;

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: boolean;
          riot_api_key: string;
          riot_api_key_status: "unknown" | "valid" | "invalid";
          riot_api_key_updated_at: string;
          riot_api_key_updated_by: string | null;
          platform_routing: string;
          regional_routing: string;
          cron_secret: string;
          created_at: string;
        };
        Insert: InsertOf<Database["public"]["Tables"]["app_settings"]["Row"], "riot_api_key">;
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          riot_puuid: string;
          riot_game_name: string;
          riot_tag_line: string;
          slug: string;
          summoner_id: string | null;
          profile_icon_id: number | null;
          display_name: string | null;
          is_admin: boolean;
          is_active: boolean;
          last_polled_at: string | null;
          created_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["profiles"]["Row"],
          "id" | "riot_puuid" | "riot_game_name" | "riot_tag_line" | "slug"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          code: string;
          created_by: string;
          used_by: string | null;
          used_at: string | null;
          expires_at: string | null;
          max_uses: number;
          uses_count: number;
          created_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["invites"]["Row"],
          "code" | "created_by"
        >;
        Update: Partial<Database["public"]["Tables"]["invites"]["Row"]>;
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          name: string;
          starts_at: string;
          ends_at: string | null;
          is_closed: boolean;
          is_current: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["seasons"]["Row"],
          "name" | "starts_at" | "created_by"
        >;
        Update: Partial<Database["public"]["Tables"]["seasons"]["Row"]>;
        Relationships: [];
      };
      lp_snapshots: {
        Row: {
          id: number;
          profile_id: string;
          queue_type: string;
          tier: Tier;
          division: Division;
          league_points: number;
          wins: number;
          losses: number;
          taken_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["lp_snapshots"]["Row"],
          "profile_id" | "tier" | "league_points" | "wins" | "losses"
        >;
        Update: Partial<Database["public"]["Tables"]["lp_snapshots"]["Row"]>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          game_creation: string;
          game_duration: number;
          queue_id: number;
          patch_version: string | null;
          raw: unknown;
          fetched_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["matches"]["Row"],
          "id" | "game_creation" | "game_duration" | "queue_id"
        >;
        Update: Partial<Database["public"]["Tables"]["matches"]["Row"]>;
        Relationships: [];
      };
      match_participants: {
        Row: {
          id: number;
          match_id: string;
          profile_id: string;
          puuid: string;
          champion_id: number;
          champion_name: string;
          role: string | null;
          team_position: string | null;
          win: boolean;
          kills: number;
          deaths: number;
          assists: number;
          cs: number;
          vision_score: number | null;
          summoner_spell1_id: number | null;
          summoner_spell2_id: number | null;
          primary_rune_id: number | null;
          primary_rune_style_id: number | null;
          sub_rune_style_id: number | null;
          item0: number | null;
          item1: number | null;
          item2: number | null;
          item3: number | null;
          item4: number | null;
          item5: number | null;
          item6: number | null;
          kill_participation: number | null;
          opponent_champion_id: number | null;
          opponent_champion_name: string | null;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["match_participants"]["Row"],
          | "match_id"
          | "profile_id"
          | "puuid"
          | "champion_id"
          | "champion_name"
          | "win"
          | "kills"
          | "deaths"
          | "assists"
          | "cs"
        >;
        Update: Partial<Database["public"]["Tables"]["match_participants"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
        ];
      };
      live_status: {
        Row: {
          profile_id: string;
          is_live: boolean;
          game_mode: string | null;
          game_start_time: string | null;
          champion_id: number | null;
          checked_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["live_status"]["Row"],
          "profile_id" | "is_live"
        >;
        Update: Partial<Database["public"]["Tables"]["live_status"]["Row"]>;
        Relationships: [];
      };
      season_results: {
        Row: {
          id: number;
          season_id: string;
          profile_id: string;
          final_rank: number;
          tier: Tier;
          division: Division;
          league_points: number;
          wins: number;
          losses: number;
          created_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["season_results"]["Row"],
          "season_id" | "profile_id" | "final_rank" | "tier" | "league_points" | "wins" | "losses"
        >;
        Update: Partial<Database["public"]["Tables"]["season_results"]["Row"]>;
        Relationships: [];
      };
      season_participants: {
        Row: {
          season_id: string;
          profile_id: string;
          added_at: string;
        };
        Insert: InsertOf<
          Database["public"]["Tables"]["season_participants"]["Row"],
          "season_id" | "profile_id"
        >;
        Update: Partial<Database["public"]["Tables"]["season_participants"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      redeem_invite: {
        Args: { p_code: string; p_user_id: string };
        Returns: boolean;
      };
      close_season: {
        Args: { p_season_id: string };
        Returns: undefined;
      };
      is_admin: {
        Args: { uid: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
