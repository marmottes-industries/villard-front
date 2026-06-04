import {apiClient} from "./client";

export interface LoginPayload {
    username: string,
    password: string
}

export interface LoginResponse {
    token: string
}

export interface User {
    id: number,
    uuid: string,
    username: string,
}

export const authApi = {
    login(payload: LoginPayload){
        return apiClient.post<LoginResponse>('/api/login', payload)
    },
    me() {
        return apiClient.get<User>('/api/me')
    }
}
