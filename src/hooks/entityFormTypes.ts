export type PostFormPayload = {
  title: string;
  content: string;
  link: string;
  date: string;
};

export type MemberFormPayload = {
  name: string;
  status: string;
  link: string;
  is_council: boolean;
};

export type ProjectFormPayload = {
  title: string;
  content: string;
  type: string;
};

export function jsonSerialize<T>(v: T): string {
  return JSON.stringify(v);
}
