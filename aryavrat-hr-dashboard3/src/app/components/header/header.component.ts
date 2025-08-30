import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-content">
        <div class="brand">
          <img src="assets/Picture1.png" alt="ARYAVRAT Logo" class="company-logo">
          <span class="brand-text">ARYAVRAT</span>
        </div>
        <div class="header-actions">
          <span class="user-name">User | Logout</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: white;
      border-bottom: 1px solid #e0e0e0;
      height: 72px;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 0 2rem;
    }
    h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.5rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-text {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: 1px;
      color: #00a3d7; /* brand teal similar to logo */
      text-transform: uppercase;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-name {
      color: #666;
      font-size: 0.9rem;
    }
    .company-logo {
      width: 70px;
      height: 70px;
      object-fit: contain;
    }
  `]
})
export class HeaderComponent {}