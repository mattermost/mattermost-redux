// Copyright (c) 2017 Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import assert from 'assert';

import * as Selectors from 'selectors/entities/general';

describe('Selectors.General', () => {
    it('canUploadFilesOnMobile', () => {
        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'false'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'true'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableMobileFileUpload: 'false'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'false',
                        EnableMobileFileUpload: 'false'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'true',
                        EnableMobileFileUpload: 'false'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableMobileFileUpload: 'true'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'false',
                        EnableMobileFileUpload: 'true'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'true',
                        EnableMobileFileUpload: 'true'
                    }
                }
            }
        }), true);
    });
    it('canDownloadFilesOnMobile', () => {
        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'false'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'true'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableMobileFileDownload: 'false'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'false',
                        EnableMobileFileDownload: 'false'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'true',
                        EnableMobileFileDownload: 'false'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableMobileFileDownload: 'true'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'false',
                        EnableMobileFileDownload: 'true'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'true',
                        EnableMobileFileDownload: 'true'
                    }
                }
            }
        }), true);
    });
});

