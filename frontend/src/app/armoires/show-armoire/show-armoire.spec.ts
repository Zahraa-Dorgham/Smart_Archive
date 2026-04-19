import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowArmoireComponent } from './show-armoire';

describe('ShowArmoire', () => {
  let component: ShowArmoireComponent;
  let fixture: ComponentFixture<ShowArmoireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowArmoireComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowArmoireComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
