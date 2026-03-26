import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowDossier } from './show-dossier';

describe('ShowDossier', () => {
  let component: ShowDossier;
  let fixture: ComponentFixture<ShowDossier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowDossier],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowDossier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
