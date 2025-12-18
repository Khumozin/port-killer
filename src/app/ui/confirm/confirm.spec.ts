import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Confirm } from './confirm';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Confirm', () => {
  let component: Confirm;
  let fixture: ComponentFixture<Confirm>;
  let mockDialogRef: {
    close: ReturnType<typeof vi.fn>;
    setAriaLabelledBy: ReturnType<typeof vi.fn>;
    setAriaDescribedBy: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    // Create mock dialog reference with all required methods
    mockDialogRef = {
      close: vi.fn(),
      setAriaLabelledBy: vi.fn(),
      setAriaDescribedBy: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Confirm],
      providers: [{ provide: BrnDialogRef, useValue: mockDialogRef }],
    }).compileComponents();

    fixture = TestBed.createComponent(Confirm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should inject BrnDialogRef', () => {
      expect(component['_dialogRef']).toBeTruthy();
    });
  });

  describe('Template Rendering', () => {
    it('should render dialog title', () => {
      const title = fixture.nativeElement.querySelector('h2[hlmAlertDialogTitle]');
      expect(title).toBeTruthy();
      expect(title?.textContent).toBe('Are you absolutely sure?');
    });

    it('should render dialog description', () => {
      const description = fixture.nativeElement.querySelector('p[hlmAlertDialogDescription]');
      expect(description).toBeTruthy();
      expect(description?.textContent?.trim()).toBe('Kill selected processes?');
    });

    it('should render dialog header', () => {
      const header = fixture.nativeElement.querySelector('hlm-alert-dialog-header');
      expect(header).toBeTruthy();
    });

    it('should render dialog footer', () => {
      const footer = fixture.nativeElement.querySelector('hlm-alert-dialog-footer');
      expect(footer).toBeTruthy();
    });

    it('should render cancel button', () => {
      const cancelButton = fixture.nativeElement.querySelector('button[hlmAlertDialogCancel]');
      expect(cancelButton).toBeTruthy();
      expect(cancelButton?.textContent?.trim()).toBe('Cancel');
    });

    it('should render continue button', () => {
      const continueButton = fixture.nativeElement.querySelector('button[hlmAlertDialogAction]');
      expect(continueButton).toBeTruthy();
      expect(continueButton?.textContent?.trim()).toBe('Continue');
    });

    it('should have footer with correct spacing', () => {
      const footer = fixture.nativeElement.querySelector('hlm-alert-dialog-footer');
      expect(footer?.classList.contains('mt-4')).toBe(true);
    });
  });

  describe('continue()', () => {
    it('should close dialog with true when continue is called', () => {
      component.continue();
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should close dialog with true when continue button is clicked', () => {
      const continueButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogAction]'
      ) as HTMLButtonElement;

      continueButton.click();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should only call close once per click', () => {
      const continueButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogAction]'
      ) as HTMLButtonElement;

      continueButton.click();

      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dialog Cancellation', () => {
    it('should have brnDialogClose directive on cancel button', () => {
      const cancelButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogCancel]'
      );
      expect(cancelButton?.hasAttribute('brndialogclose')).toBe(true);
    });

    it('should not call continue method when cancel button is clicked', () => {
      const continueSpy = vi.spyOn(component, 'continue');
      const cancelButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogCancel]'
      ) as HTMLButtonElement;

      cancelButton.click();

      expect(continueSpy).not.toHaveBeenCalled();
    });
  });

  describe('Button Styling and Attributes', () => {
    it('should have alert dialog action directive on continue button', () => {
      const continueButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogAction]'
      );
      expect(continueButton?.hasAttribute('hlmalertdialogaction')).toBe(true);
    });

    it('should have alert dialog cancel directive on cancel button', () => {
      const cancelButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogCancel]'
      );
      expect(cancelButton?.hasAttribute('hlmalertdialogcancel')).toBe(true);
    });

    it('should render both buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });
  });

  describe('Accessibility', () => {
    it('should use semantic heading for title', () => {
      const title = fixture.nativeElement.querySelector('h2[hlmAlertDialogTitle]');
      expect(title).toBeTruthy();
      expect(title?.tagName.toLowerCase()).toBe('h2');
    });

    it('should use semantic paragraph for description', () => {
      const description = fixture.nativeElement.querySelector('p[hlmAlertDialogDescription]');
      expect(description).toBeTruthy();
      expect(description?.tagName.toLowerCase()).toBe('p');
    });

    it('should use semantic button elements', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.tagName.toLowerCase()).toBe('button');
      });
    });

    it('should have descriptive button text', () => {
      const cancelButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogCancel]'
      );
      const continueButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogAction]'
      );

      expect(cancelButton?.textContent?.trim()).toBeTruthy();
      expect(continueButton?.textContent?.trim()).toBeTruthy();
      expect(cancelButton?.textContent?.trim().length).toBeGreaterThan(0);
      expect(continueButton?.textContent?.trim().length).toBeGreaterThan(0);
    });
  });

  describe('Dialog Structure', () => {
    it('should have header before footer', () => {
      const header = fixture.nativeElement.querySelector('hlm-alert-dialog-header');
      const footer = fixture.nativeElement.querySelector('hlm-alert-dialog-footer');

      expect(header).toBeTruthy();
      expect(footer).toBeTruthy();
    });

    it('should have title and description in header', () => {
      const header = fixture.nativeElement.querySelector('hlm-alert-dialog-header');
      const title = header?.querySelector('h2[hlmAlertDialogTitle]');
      const description = header?.querySelector('p[hlmAlertDialogDescription]');

      expect(title).toBeTruthy();
      expect(description).toBeTruthy();
    });

    it('should have both buttons in footer', () => {
      const footer = fixture.nativeElement.querySelector('hlm-alert-dialog-footer');
      const buttons = footer?.querySelectorAll('button');

      expect(buttons?.length).toBe(2);
    });
  });

  describe('Dialog Content', () => {
    it('should display warning about process termination', () => {
      const description = fixture.nativeElement.querySelector('p[hlmAlertDialogDescription]');
      expect(description?.textContent).toContain('Kill selected processes');
    });

    it('should ask for confirmation', () => {
      const title = fixture.nativeElement.querySelector('h2[hlmAlertDialogTitle]');
      expect(title?.textContent).toContain('Are you absolutely sure');
    });

    it('should provide clear action options', () => {
      const cancelButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogCancel]'
      );
      const continueButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogAction]'
      );

      expect(cancelButton?.textContent?.trim()).toBe('Cancel');
      expect(continueButton?.textContent?.trim()).toBe('Continue');
    });
  });

  describe('User Interaction', () => {
    it('should respond to continue button click', () => {
      const continueButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogAction]'
      ) as HTMLButtonElement;

      expect(() => continueButton.click()).not.toThrow();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should respond to cancel button click', () => {
      const cancelButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogCancel]'
      ) as HTMLButtonElement;

      expect(() => cancelButton.click()).not.toThrow();
    });

    it('should handle multiple continue clicks', () => {
      const continueButton = fixture.nativeElement.querySelector(
        'button[hlmAlertDialogAction]'
      ) as HTMLButtonElement;

      continueButton.click();
      continueButton.click();

      expect(mockDialogRef.close).toHaveBeenCalledTimes(2);
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});
