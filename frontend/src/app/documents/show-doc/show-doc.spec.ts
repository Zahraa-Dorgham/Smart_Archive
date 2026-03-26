import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowDocumentComponent } from './show-doc';

describe('ShowDoc', () => {
  let component: ShowDocumentComponent;
  let fixture: ComponentFixture<ShowDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowDocumentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowDocumentComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
