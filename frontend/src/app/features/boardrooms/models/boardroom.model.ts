export interface Amenity {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Boardroom {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  location: string | null;
  isActive: boolean;
  amenities: Amenity[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardroomCreateRequest {
  name: string;
  description?: string;
  capacity: number;
  location?: string;
  isActive?: boolean;
  amenityIds?: string[];
}

export type BoardroomUpdateRequest = Partial<BoardroomCreateRequest>;

export interface AmenityCreateRequest {
  name: string;
  description?: string;
  icon?: string;
}

export type AmenityUpdateRequest = Partial<AmenityCreateRequest>;
