import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowArmoire } from './show-armoire';

describe('ShowArmoire', () => {
  let component: ShowArmoire;
  let fixture: ComponentFixture<ShowArmoire>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowArmoire],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowArmoire);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
