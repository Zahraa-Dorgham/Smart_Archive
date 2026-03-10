import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowSalleComponent } from './show-salle';

describe('ShowSalle', () => {
  let component: ShowSalleComponent;
  let fixture: ComponentFixture<ShowSalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowSalleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowSalleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
