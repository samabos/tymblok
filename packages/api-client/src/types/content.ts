export interface SupportContentDto {
  id: string;
  slug: string;
  title: string;
  content: string;
  contentType: string;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportContentsResponse {
  contents: SupportContentDto[];
}
