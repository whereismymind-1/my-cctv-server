/**
 * 공통 타입 정의
 */

// 기본 ID 타입
export type ID = string;
export type Timestamp = number;

// 결과 타입 (Either 패턴)
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

// 페이지네이션
export interface Pagination {
  page: number;
  limit: number;
  total?: number;
}

// 이벤트 기본 인터페이스
export interface DomainEvent {
  id: ID;
  type: string;
  timestamp: Timestamp;
  payload: unknown;
}

// WebSocket 메시지 타입
export interface WebSocketMessage<T = unknown> {
  type: string;
  id?: string;
  timestamp: Timestamp;
  data: T;
}