/* global $ */

import { getLogger } from 'jitsi-meet-logger';
import { $iq, Strophe } from 'strophe.js';

import ConnectionPlugin from './ConnectionPlugin';

const logger = getLogger(__filename);

const TOKEN_XMLNS = 'urn:xmpp:token:gen:1';


/**
 *
 */
class TokenGenConnectionPlugin extends ConnectionPlugin {
    /**
     *
     * @param connection
     */
    init(connection) {
        super.init(connection);

        this.connection.addHandler(
            this.onTokenGen.bind(this), TOKEN_XMLNS, 'iq', 'set', null, null);
    }

    /**
     *
     * @param iq
     */
    onTokenGen(iq) {
        logger.debug('onTokenGen IQ', iq);
    }

    /**
     *
     */
    generate(tokensData) {

        const req = $iq({
            type: 'get',
            to: this.connection.domain
        });

        req.c('tokens', { xmlns: TOKEN_XMLNS });

        // if there are no data provided then we will generate token
        // for current user
        const _tokens = tokensData || [ {} ];

        _tokens.forEach(token => {
            req.c('token', token).up();
        });

        return new Promise((resolve, reject) => {
            this.connection.sendIQ(
                req,
                result => {
                    logger.info('Token gen result ', result);

                    const res = $(result)
                        .find('>tokens>token')
                        .map((index, item) => {
                            return {
                                email: $(item).attr('user'),
                                token: $(item).attr('token')
                            };
                        });

                    resolve(res);
                },
                error => {
                    logger.info('Token gen error ', error);
                    reject(error);
                });
        });
    }
}

/**
 *
 */
export default function() {
    Strophe.addConnectionPlugin('tokengen', new TokenGenConnectionPlugin());
}
