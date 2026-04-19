
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppComponent } from '../../app';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './not-found.component.html',
    styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent {
    public app = inject(AppComponent);
    private router = inject(Router);


    getGlitchText(): string {
        const texts = ['404', 'ERROR', 'VOID', 'NULL', 'LOST'];
        return texts[Math.floor(Math.random() * texts.length)];
    }

    goBack(): void {
        window.history.back();
    }

    get timestamp(): string {
        return new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

}