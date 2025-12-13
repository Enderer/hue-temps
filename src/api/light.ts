export interface Light {
    id: string,
    name: string,
    state?: {
      on?: boolean,
      ct?: number;
    },
    capabilities?: {
      control?: {
        maxlumen?: number;
        ct?: { min?: number; max?: number; }
      }
    }
  }
