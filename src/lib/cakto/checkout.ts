import { caktoFetch } from './auth';

const CAKTO_CHECKOUT_BASE = 'https://pay.cakto.com.br';

export interface CaktoOffer {
  id: string;
  name: string;
  price: number;
  product: string;
  status: 'active' | 'disabled' | 'deleted';
  type: 'unique' | 'subscription';
  intervalType: 'week' | 'month' | 'year' | 'lifetime';
  interval: number;
  recurrence_period: number;
}

export interface CaktoCheckoutUrlParams {
  offerId: string;
  customerEmail: string;
  customerName: string;
  customerCpf?: string;
  customerPhone?: string;
  returnUrl?: string;
  customId?: string;
}

export function buildCheckoutUrl(params: CaktoCheckoutUrlParams): string {
  const { offerId, customerEmail, customerName, customerCpf, customerPhone, returnUrl, customId } = params;
  
  const url = new URL(`${CAKTO_CHECKOUT_BASE}/${offerId}`);
  
  if (customerEmail) {
    url.searchParams.set('email', customerEmail);
    url.searchParams.set('confirmEmail', customerEmail);
  }
  
  if (customerName) {
    url.searchParams.set('name', customerName);
  }
  
  if (customerCpf) {
    url.searchParams.set('cpf', customerCpf);
  }
  
  if (customerPhone) {
    url.searchParams.set('phone', customerPhone);
  }
  
  if (returnUrl) {
    url.searchParams.set('return_url', returnUrl);
  }
  
  if (customId) {
    url.searchParams.set('custom_id', customId);
  }
  
  return url.toString();
}

export async function getOfferDetails(offerId: string): Promise<CaktoOffer> {
  return caktoFetch<CaktoOffer>(`/public_api/offers/${offerId}/`);
}

export async function listOffers(): Promise<{ results: CaktoOffer[]; count: number }> {
  return caktoFetch<{ results: CaktoOffer[]; count: number }>('/public_api/offers/?status=active&type=subscription');
}

export function getMonthlyOfferId(): string {
  const offerId = process.env.CAKTO_OFFER_MONTHLY_ID;
  if (!offerId) {
    throw new Error('CAKTO_OFFER_MONTHLY_ID not configured');
  }
  return offerId;
}

export function getAnnualOfferId(): string {
  const offerId = process.env.CAKTO_OFFER_ANNUAL_ID;
  if (!offerId) {
    throw new Error('CAKTO_OFFER_ANNUAL_ID not configured');
  }
  return offerId;
}