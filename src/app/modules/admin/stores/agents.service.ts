import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environment/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface Agent {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    storeId: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAgentDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    storeId: string;
}

export interface UpdateAgentDto {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phone: string;
    storeId: string;
}

export interface PaginatedAgentsResponse {
    data: Agent[];
    total: number;
}

export interface AgentQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    storeId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgentsService {
    private readonly url: string = environment.url;

    private _agents: BehaviorSubject<Agent[]> = new BehaviorSubject<Agent[]>([]);
    public readonly agents$ = this._agents.asObservable();

    private _agent: BehaviorSubject<Agent | null> = new BehaviorSubject<Agent | null>(null);
    public readonly agent$ = this._agent.asObservable();

    private _pagination: BehaviorSubject<{ total: number; page: number; limit: number; }> =
        new BehaviorSubject({ total: 0, page: 1, limit: 10 });
    public readonly pagination$ = this._pagination.asObservable();

    constructor(private httpClient: HttpClient) { }

    /**
     * Get all agents with pagination and search
     */
    getAgents(params?: AgentQueryParams): Observable<PaginatedAgentsResponse> {
        let queryParams = '';
        if (params) {
            const queryArray = [];
            if (params.page) queryArray.push(`page=${params.page}`);
            if (params.limit) queryArray.push(`limit=${params.limit}`);
            if (params.search) queryArray.push(`search=${encodeURIComponent(params.search)}`);
            if(params.storeId) queryArray.push(`storeId=${params.storeId}`);
            if (queryArray.length > 0) {
                queryParams = '?' + queryArray.join('&');
            }
        }

        return this.httpClient.get<PaginatedAgentsResponse>(`${this.url}/agents${queryParams}`).pipe(
            tap(response => {
                this._agents.next(response.data);
                this._pagination.next({
                    total: response.total,
                    page: params?.page || 1,
                    limit: params?.limit || 10
                });
            })
        );
    }

    /**
     * Get agent by ID
     */
    getAgentById(id: string): Observable<Agent> {
        return this.httpClient.get<Agent>(`${this.url}/agents/${id}`).pipe(
            tap(agent => this._agent.next(agent))
        );
    }

    /**
     * Create new agent
     */
    createAgent(data: CreateAgentDto): Observable<Agent> {
        return this.httpClient.post<Agent>(`${this.url}/agents`, data).pipe(
            tap(agent => {
                const currentAgents = this._agents.value;
                this._agents.next([...currentAgents, agent]);
            })
        );
    }

    /**
     * Update agent
     */
    updateAgent(id: string, data: UpdateAgentDto): Observable<Agent> {
        return this.httpClient.post<Agent>(`${this.url}/agents/${id}`, data).pipe(
            tap(updatedAgent => {
                const currentAgents = this._agents.value;
                const index = currentAgents.findIndex(a => a.id === id);
                if (index !== -1) {
                    currentAgents[index] = updatedAgent;
                    this._agents.next([...currentAgents]);
                }
                this._agent.next(updatedAgent);
            })
        );
    }

    /**
     * Delete agent
     */
    deleteAgent(id: string): Observable<void> {
        return this.httpClient.delete<void>(`${this.url}/agents/${id}`).pipe(
            tap(() => {
                const currentAgents = this._agents.value.filter(a => a.id !== id);
                this._agents.next(currentAgents);
            })
        );
    }
}
