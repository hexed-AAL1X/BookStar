export interface OrderItem {
  bookId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  authorName?: string;
  authorId?: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'shipped' | 'in_progress';

export interface Order {
  _id: string;
  userId: string;
  user?: { name: string; _id: string };
  items: OrderItem[];
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}