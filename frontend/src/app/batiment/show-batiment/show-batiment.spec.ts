import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowBatimentComponent } from './show-batiment';
describe('ShowBatiment', () => {
  let component: ShowBatimentComponent;
  let fixture: ComponentFixture<ShowBatimentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowBatimentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowBatimentComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
