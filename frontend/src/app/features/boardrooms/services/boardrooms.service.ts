import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Boardroom,
  BoardroomCreateRequest,
  BoardroomUpdateRequest
} from '../models/boardroom.model';

@Injectable({ providedIn: 'root' })
export class BoardroomsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/boardrooms`;

  list(activeOnly = false): Observable<Boardroom[]> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('activeOnly', 'true');
    }
    return this.http.get<Boardroom[]>(this.url, { params });
  }

  get(id: string): Observable<Boardroom> {
    return this.http.get<Boardroom>(`${this.url}/${id}`);
  }

  create(payload: BoardroomCreateRequest): Observable<Boardroom> {
    return this.http.post<Boardroom>(this.url, payload);
  }

  update(id: string, payload: BoardroomUpdateRequest): Observable<Boardroom> {
    return this.http.patch<Boardroom>(`${this.url}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
