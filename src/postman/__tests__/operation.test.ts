import { Collection, HeaderDefinition, RequestAuth, RequestAuthDefinition, RequestBody } from 'postman-collection';
import { transformPostmanCollectionOperation } from '../operation';

describe('transformPostmanCollectionOperation()', () => {
  describe('operation can be found', () => {
    describe('description is set', () => {
      it('returns operation with description', () => {
        expect(
          transformPostmanCollectionOperation({
            document: {
              item: [
                {
                  request: {
                    method: 'get',
                    url: '/path/:param?a=b',
                    body: { mode: 'raw', raw: 'test' } as RequestBody,
                    header: [{ key: 'header', value: 'a header' }] as HeaderDefinition,
                  },
                  description: 'desc',
                },
              ],
            },
            method: 'get',
            path: '/path/{param}',
          }),
        ).toEqual({
          description: 'desc',
          id: '?http-operation-id?',
          iid: expect.stringMatching(/^[a-z0-9]{8}-([a-z0-9]{4}-){3}[a-z0-9]{12}$/),
          method: 'get',
          path: '/path/{param}',
          request: expect.any(Object),
          responses: [],
          security: [],
          summary: undefined,
        });
      });
    });

    describe('description is not set', () => {
      it('returns operation without description', () => {
        expect(
          transformPostmanCollectionOperation({
            document: { item: [{ request: { method: 'get', url: '/path' } }] },
            method: 'get',
            path: '/path',
          }),
        ).toEqual(expect.objectContaining({ description: undefined }));
      });
    });

    describe('content-type is set', () => {
      it('returns operation with body media-type set', () => {
        expect(
          transformPostmanCollectionOperation({
            document: {
              item: [
                {
                  request: {
                    method: 'get',
                    url: '/path',
                    header: [{ key: 'content-type', value: 'application/json' }] as HeaderDefinition,
                    body: {
                      mode: 'raw',
                      raw: '{}',
                    } as RequestBody,
                  },
                },
              ],
            },
            method: 'get',
            path: '/path',
          }),
        ).toEqual(expect.objectContaining({ description: undefined }));
      });
    });

    describe('auth is set', () => {
      describe('auth transforms to security scheme', () => {
        it('', () => {
          expect(
            transformPostmanCollectionOperation({
              document: {
                item: [
                  {
                    request: {
                      method: 'get',
                      url: '/path',
                      auth: { type: 'basic' },
                    },
                  },
                ],
              },
              method: 'get',
              path: '/path',
            }),
          ).toEqual(
            expect.objectContaining({
              security: [[{ key: 'http-0', scheme: 'basic', type: 'http' }]],
            }),
          );
        });
      });

      describe('auth transforms to header params', () => {
        it('it appends authorization data to headers', () => {
          expect(
            transformPostmanCollectionOperation({
              document: {
                item: [
                  {
                    request: {
                      method: 'get',
                      url: '/path',
                      auth: { type: 'hawk' },
                    },
                  },
                ],
              },
              method: 'get',
              path: '/path',
            }),
          ).toEqual(
            expect.objectContaining({
              request: expect.objectContaining({
                headers: [
                  {
                    description: 'Hawk Authorization Header',
                    name: 'Authorization',
                    required: true,
                    schema: { pattern: '^Hawk .+$', type: 'string' },
                    style: 'simple',
                  },
                ],
              }),
            }),
          );
        });
      });

      describe('auth transforms to query params', () => {
        it('it appends authorization data to query params', () => {
          expect(
            transformPostmanCollectionOperation({
              document: {
                item: [
                  {
                    request: {
                      method: 'get',
                      url: '/path',
                      auth: {
                        type: 'oauth2',
                        oauth2: [
                          {
                            key: 'addTokenTo',
                            value: 'queryParams',
                            type: 'string',
                          },
                        ],
                      } as RequestAuthDefinition,
                    },
                  },
                ],
              },
              method: 'get',
              path: '/path',
            }),
          ).toEqual(
            expect.objectContaining({
              request: expect.objectContaining({
                query: [{ description: 'OAuth2 Access Token', name: 'access_token', required: true, style: 'form' }],
              }),
            }),
          );
        });
      });

      describe('auth is set to noauth', () => {
        it('ignores it', () => {
          expect(
            transformPostmanCollectionOperation({
              document: {
                item: [
                  {
                    request: {
                      method: 'get',
                      url: '/path',
                      auth: { type: 'nooauth' },
                    },
                  },
                ],
              },
              method: 'get',
              path: '/path',
            }),
          ).toEqual(
            expect.objectContaining({
              request: expect.objectContaining({
                headers: [],
                query: [],
              }),
              security: [],
            }),
          );
        });
      });
    });
  });

  describe('operation cannot be found', () => {
    it('throws an error', () => {
      expect(() =>
        transformPostmanCollectionOperation({
          document: { item: [{ request: { method: 'get', url: '/path' } }] },
          method: 'get',
          path: '/non-existing',
        }),
      ).toThrowError('Unable to find "get /non-existing"');
    });
  });
});
