import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcessDetail } from './process-detail';

describe('ProcessDetail', () => {
  let component: ProcessDetail;
  let fixture: ComponentFixture<ProcessDetail>;

  const mockProcess = {
    pid: '1234',
    command: 'node',
    user: 'john',
    fullCommand: 'node server.js',
    parentChain: [
      {
        pid: '100',
        ppid: '1',
        command: 'bash',
        user: 'john',
        fullCommand: '/bin/bash',
      },
      {
        pid: '1',
        ppid: '0',
        command: 'launchd',
        user: 'root',
        fullCommand: '/sbin/launchd',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('process', mockProcess);
    fixture.componentRef.setInput('port', 3000);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display process information', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('1234');
    expect(compiled.textContent).toContain('node');
    expect(compiled.textContent).toContain('john');
    expect(compiled.textContent).toContain('node server.js');
  });

  it('should display parent chain', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Parent Process Chain');
    expect(compiled.textContent).toContain('bash');
    expect(compiled.textContent).toContain('launchd');
  });

  it('should handle empty parent chain', () => {
    const processWithoutParents = { ...mockProcess, parentChain: [] };
    fixture.componentRef.setInput('process', processWithoutParents);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).not.toContain('Parent Process Chain');
  });

  it('should display port number in heading', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Process on Port 3000');
  });

  it('should display numbered parent chain items', () => {
    const compiled = fixture.nativeElement;
    const listItems = compiled.querySelectorAll('ol li');
    expect(listItems.length).toBe(2);
  });
});
