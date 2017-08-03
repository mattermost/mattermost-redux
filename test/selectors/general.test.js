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
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'false'
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'true'
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableMobileFileUpload: 'false'
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
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
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
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
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableMobileFileUpload: 'true'
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
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
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
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
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'false'
                    },
                    license: {
                        IsLicensed: 'false',
                        Compliance: 'false'
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
                    },
                    license: {
                        IsLicensed: 'false',
                        Compliance: 'false'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canUploadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableFileAttachments: 'true',
                        EnableMobileFileUpload: 'false'
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'false'
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
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableMobileFileDownload: 'false'
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true,'
                    }
                }
            }
        }), false);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableMobileFileDownload: 'true'
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'true'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableMobileFileDownload: 'false'
                    },
                    license: {
                        IsLicensed: 'false',
                        Compliance: 'false'
                    }
                }
            }
        }), true);

        assert.equal(Selectors.canDownloadFilesOnMobile({
            entities: {
                general: {
                    config: {
                        EnableMobileFileDownload: 'false'
                    },
                    license: {
                        IsLicensed: 'true',
                        Compliance: 'false'
                    }
                }
            }
        }), true);
    });
});

