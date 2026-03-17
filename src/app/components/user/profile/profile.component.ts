import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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

  readonly user$ = this.authState.user$;

  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }
}
