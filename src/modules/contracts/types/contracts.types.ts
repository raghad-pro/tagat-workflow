export interface Contract {
  id: number;
  customerName: string;
  initial: string;
  title: string;
  project: string;
  company: string;
}

export interface ContractStats {
  activeContracts: { value: string; label: string };
  pendingSignature: { value: string; label: string };
  expiringSoon: { value: string; label: string };
}

export interface ContractsQueryParams {
  page?: number;
  search?: string;
  per_page?: number;
}
