import { TestBed } from '@angular/core/testing';

import { BlogPostDataClientService } from './blog-post-data-client.service';

describe('BlogPostDataClientService', () => {
  let service: BlogPostDataClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlogPostDataClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
