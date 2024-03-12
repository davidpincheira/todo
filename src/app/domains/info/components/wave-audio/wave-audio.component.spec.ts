import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaveAudioComponent } from './wave-audio.component';

describe('WaveAudioComponent', () => {
  let component: WaveAudioComponent;
  let fixture: ComponentFixture<WaveAudioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaveAudioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WaveAudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
