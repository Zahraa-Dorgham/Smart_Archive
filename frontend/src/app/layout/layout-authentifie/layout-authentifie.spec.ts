import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutAuthentifieComponent } from './layout-authentifie';

describe('LayoutAuthentifieComponent', () => {
  let component: LayoutAuthentifieComponent;
  let fixture: ComponentFixture<LayoutAuthentifieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutAuthentifieComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutAuthentifieComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
