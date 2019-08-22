/* global $ */

import { getLogger } from 'jitsi-meet-logger';
import { $iq, Strophe } from 'strophe.js';

import ConnectionPlugin from './ConnectionPlugin';

const logger = getLogger(__filename);

const SMTP_EMAIL_XMLNS = 'urn:xmpp::email:smtp:1';


/**
 *
 */
class SmtpEmailConnectionPlugin extends ConnectionPlugin {
    /**
     *
     * @param connection
     */
    init(connection) {
        super.init(connection);

        this.connection.addHandler(
            this.onSmtpEmail.bind(this),
            SMTP_EMAIL_XMLNS,
            'iq',
            'set',
            null,
            null
        );
    }

    /**
     *
     * @param iq
     */
    onSmtpEmail(iq) {
        logger.debug('onSmtpEmail IQ', iq);
    }

    /**
     *
     */
    send(tokensData) {

        const req = $iq({
            type: 'get',
            to: this.connection.domain
        });

        req.c('emails', { xmlns: SMTP_EMAIL_XMLNS });

        // if there are no data provided then we will generate token
        // for current user
        const _emails = tokensData || [ {} ];

        _emails.forEach(email => {
            const { body, ...rest } = email;
            const node = req.c('email', rest);

            if (body) {
                body.forEach(item => {
                    const { text, ...attrs } = item;

                    req.c('part', attrs, text).up();
                });
            }
            node.up();
        });

        return new Promise((resolve, reject) => {
            this.connection.sendIQ(
                req,
                result => {
                    logger.info('Smtp send gen result ', result);

                    const res = $(result)
                        .find('>emails>email')
                        .map((index, item) => {
                            return {
                                email: $(item).attr('user'),
                                sent: $(item).attr('sent') === 'yes'
                            };
                        });

                    resolve(res);
                },
                error => {
                    logger.info('Smtp send error ', error);
                    reject(error);
                });
        });
    }
}

/**
 *
 */
export default function() {
    Strophe.addConnectionPlugin('smtpemail', new SmtpEmailConnectionPlugin());
}
