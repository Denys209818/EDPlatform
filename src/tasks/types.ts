export type TTaskOption = {
  text: string;
  isCorrect: boolean;
};

export interface IHashWithResponse<T> {
  bodyHash: string;
  response: T;
}
