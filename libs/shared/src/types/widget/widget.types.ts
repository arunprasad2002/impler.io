export interface IInitPayload {
  template?: string;
  accessToken?: string;
}
export interface IShowPayload {
  extra?: string;
  authHeaderValue?: string;
}
export interface IOption {
  value: string;
  label: string;
}