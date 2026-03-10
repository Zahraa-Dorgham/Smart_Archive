import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Batiment } from './batiment';

describe('Batiment', () => {
  let component: Batiment;
  let fixture: ComponentFixture<Batiment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Batiment],
    }).compileComponents();

    fixture = TestBed.createComponent(Batiment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
