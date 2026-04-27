export interface DomainEvent {
  type: string;
  timestamp: Date;
  payload: Record<string, any>;
}