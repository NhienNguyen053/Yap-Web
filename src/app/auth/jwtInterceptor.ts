import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { AppService } from '../app.service';
import { Router } from '@angular/router';


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(
    private injector: Injector,
    private router: Router
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');

    if (token) {
      const appService = this.injector.get(AppService);
      const decodedToken = appService.decodeToken();
      if (decodedToken.exp < Math.floor(Date.now() / 1000)) {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
        return EMPTY;
      }
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}
