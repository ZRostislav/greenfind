import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AuthStateService } from '../../../services/auth-state.service';
import {
  LucideAngularModule,
  Search,
  Mic,
  Sliders,
  Globe,
  Link,
  Check,
  X,
  Plus,
  Minus,
  Type,
  FileText,
  Leaf,
  ArrowRight,
  LogOutIcon,
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  ShieldIcon,
  CheckCircleIcon,
  HistoryIcon,
} from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  readonly SearchIcon = Search;
  readonly MicIcon = Mic;
  readonly SlidersIcon = Sliders;
  readonly GlobeIcon = Globe;
  readonly LinkIcon = Link;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly PlusIcon = Plus;
  readonly MinusIcon = Minus;
  readonly TypeIcon = Type;
  readonly FileTextIcon = FileText;
  readonly LeafIcon = Leaf;
  readonly ArrowRightIcon = ArrowRight;
  readonly LogOutIcon = LogOutIcon;
  readonly ArrowLeftIcon = ArrowLeftIcon;
  readonly UserIcon = UserIcon;
  readonly MailIcon = MailIcon;
  readonly ShieldIcon = ShieldIcon;
  readonly CheckCircleIcon = CheckCircleIcon;
  readonly HistoryIcon = HistoryIcon;

  private readonly auth = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly user$ = this.authState.user$;
  returnUrl = '/';
  showDeleteConfirm = false;
  deletingAccount = false;
  deleteError: string | null = null;

  constructor() {
    const rawReturnUrl = (this.route.snapshot.queryParamMap.get('returnUrl') || '').trim();
    this.returnUrl = rawReturnUrl.startsWith('/') ? rawReturnUrl : '/';
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }

  openDeleteConfirm() {
    this.deleteError = null;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm() {
    if (this.deletingAccount) return;
    this.showDeleteConfirm = false;
  }

  confirmDeleteAccount() {
    if (this.deletingAccount) return;

    this.deleteError = null;
    this.deletingAccount = true;
    this.auth.deleteAccount().subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => {
        this.deletingAccount = false;
        this.deleteError = 'Failed to delete account. Please try again.';
      },
    });
  }

  goBack() {
    this.router.navigateByUrl(this.returnUrl || '/');
  }
}
