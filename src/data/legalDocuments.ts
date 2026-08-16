export type LegalDocumentKey = 'terms' | 'privacy' | 'community';

export const legalDocuments: Record<LegalDocumentKey, { title: string; body: string }> = {
  terms: {
    title: 'Terms of Use',
    body: `TEAMCAL TERMS AND CONDITIONS

Effective Date: These Terms and Conditions become effective for each user on the date the user creates a TeamCal account and agrees to these Terms.

These Terms govern your access to and use of the TeamCal mobile application, website, software, features, communities, creator tools, artificial intelligence features, health and wellness tools, marketplace features, and related services (collectively, the Services).

By creating a TeamCal account, accessing or using the Services, you confirm that you are 18 years of age or older and that you have read, understood, and agreed to these Terms and our Privacy Policy. If you do not agree, you must not create an account or use TeamCal.

1. Eligibility and Minimum Age

You must be at least 18 years old, have legal capacity to accept these Terms, provide accurate information, and use TeamCal lawfully. TeamCal may restrict, suspend, or terminate accounts that do not satisfy these requirements.

2. Your Account

You are responsible for safeguarding your credentials and activity through your account. Notify TeamCal promptly of unauthorized access. You may not impersonate others, provide deliberately misleading information, transfer an account without authorization, or use TeamCal fraudulently.

3. Acceptable Use and Prohibited Content

You must not create, upload, publish, sell, share, transmit, promote, request, or distribute content involving sexual exploitation or explicit sexual content; threats or serious violence; self-harm; harassment, stalking or abuse; hatred or unlawful discrimination; crime, fraud, scams or impersonation; infringement of intellectual-property, privacy or publicity rights; unauthorized private information; malware, spam or automated abuse; interference with TeamCal systems; or other unlawful conduct.

TeamCal may investigate, restrict, remove, or disable violating content or accounts.

4. User-Generated Content

You retain ownership of original content you create. By publishing it through TeamCal, you grant TeamCal a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, process, transmit, display, and distribute it as reasonably necessary to operate, secure, promote, and improve the Services. You confirm you have the rights required to publish that content and remain responsible for it.

5. Communities and Social Features

Posts, comments, chats, communities, memberships, live sessions, events, blogs, videos, games, and other social features must be used respectfully. Users can report suspected violations and block users where provided. TeamCal may review reports and restrict content or accounts.

6. Health, Nutrition, Fitness and Wellness Features

Health and wellness features are for general informational purposes unless expressly stated otherwise. TeamCal does not replace a doctor, dietitian, or licensed healthcare professional. Do not delay professional care because of information received through TeamCal.

7. Artificial Intelligence Features

AI features can produce inaccurate, incomplete, outdated, or inappropriate results. You are responsible for reviewing AI output before relying on, publishing, distributing, purchasing based upon, or acting upon it.

8. Creator Content and Marketplace

Creators must ensure their products, memberships, communities, services, courses, videos, PDFs, subscriptions, and other offerings are lawful, accurately represented, non-infringing, and compliant with applicable consumer-protection laws. TeamCal may remove prohibited or misleading offerings.

9. Purchases and Subscriptions

Prices, features, billing periods, and availability may change subject to law. Applicable price and purchase information will be displayed before completion. Apple, Google, Stripe, or another payment provider’s terms may also apply.

10. Creator Earnings and Payouts

Earnings may be subject to fees, refunds, disputes, chargebacks, taxes, payout thresholds, and verification. TeamCal does not guarantee earnings. Associated earnings may be withheld or reversed for invalid transactions where legally permitted.

11. Referral Programme

The referral programme is governed by separate Referral Programme Terms. Participation does not guarantee earnings.

12. Intellectual Property

TeamCal software, branding, logos, interfaces, designs, systems, technology, and original materials are protected by law. No ownership transfers to users. Unauthorized copying, modification, distribution, sale, licensing, reverse engineering, or commercial exploitation is prohibited except where law permits.

13. Intellectual-Property Complaints

Rights holders may contact TeamCal with information identifying their protected work, the allegedly infringing material, and the basis of their rights. TeamCal may remove infringing content and act against repeat infringers.

14. Privacy and Personal Information

Use of TeamCal is subject to the Privacy Policy, which explains how personal information is processed. By creating an account, you acknowledge that policy.

15. Third-Party Services

Third-party platforms, payment processors, cloud providers, APIs, and websites may have separate terms and privacy practices. TeamCal does not control independent third-party services to the extent permitted by law.

16. Account Suspension and Termination

TeamCal may restrict, suspend, or terminate accounts for material or repeated violations, fraud, abuse, serious harassment, infringement, security attacks, or unlawful use. Where appropriate and legally required, notice or appeal may be provided.

17. Account Deletion

You may delete your account through TeamCal settings. TeamCal will delete or anonymize associated personal information according to the Privacy Policy, subject to lawful retention. Deletion may permanently remove content, communities, creator tools, analytics, earnings information, and other account information.

18. Service Availability and Changes

Services may experience maintenance, updates, technical problems, or interruptions. Features may be updated, replaced, or discontinued where reasonably necessary, subject to law and existing rights. Continuous, secure, or error-free availability is not guaranteed.

19. Security and Misuse

Unauthorized access, scraping, bots, malicious code, circumvention, vulnerability exploitation, denial-of-service activity, and interference with TeamCal infrastructure are prohibited.

20. Disclaimers

To the extent permitted by law, TeamCal is provided on an “as available” basis. Information, recommendations, AI outputs, wellness insights, creator content, user content, and third-party information may not always be accurate, complete, current, or suitable. Mandatory consumer protections are not excluded.

21. Limitation of Liability

To the maximum extent permitted by law, TeamCal and its operators are not liable for indirect, incidental, special, exemplary, punitive, or consequential losses. Liability that cannot legally be excluded remains unaffected.

22. Indemnification

To the extent permitted by law, you are responsible for claims and reasonable expenses arising from unlawful use, material violation of these Terms, or content that infringes another person’s rights.

23. Changes to These Terms

TeamCal may update these Terms for changes to Services, laws, regulation, security, or operations. Material changes will receive appropriate notice and additional consent where legally required.

24. Governing Law

These Terms are governed by the laws of the Federal Republic of Nigeria, without limiting mandatory consumer rights that apply under other law.

25. Severability

If a provision is invalid or unenforceable, the remaining provisions continue to apply as far as legally permitted.

26. Entire Agreement

These Terms, the Privacy Policy, and additional terms applicable to specific features or programmes constitute the agreement governing use of TeamCal.

27. Contact Us

TeamCal / Dibe Development
Website: dibedevelopment.com
Email: support@dibedevelopment.com

By creating an account and using the Services, you confirm that you are at least 18 and have read, understood, and agreed to these Terms.`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `TEAMCAL PRIVACY POLICY

Effective date: This policy applies when you create or use a TeamCal account.

TeamCal / Dibe Development processes account details, profile information, content, social interactions, health and wellness entries, device and usage information, purchase and payout records, support messages, and information you choose to connect from device health services.

We use information to provide and secure TeamCal; personalize features; sync health data with permission; process purchases and payouts; operate communities and moderation; provide support; prevent fraud; comply with law; and improve our Services.

Health information is used only for the features you request and is not sold. Device permissions can be changed in your device settings. Some functionality may stop when permission is withdrawn.

Information may be shared with service providers that support hosting, authentication, analytics, communications, AI functionality, payments, fraud prevention, and customer support; with other users when you publish content; or when required by law. Providers may process information in other countries subject to appropriate safeguards.

We retain information only as long as reasonably necessary for the purposes described, legal obligations, disputes, safety, fraud prevention, and transaction records. You may request access, correction, export, or deletion where applicable. In-app account deletion is available in Settings.

We use administrative, technical, and organizational safeguards, but no electronic service can guarantee absolute security. Users under 18 may not create a TeamCal account.

Material policy changes will be communicated through TeamCal or another appropriate channel. For privacy requests contact support@dibedevelopment.com or visit dibedevelopment.com.`,
  },
  community: {
    title: 'Community Guidelines',
    body: `TEAMCAL COMMUNITY GUIDELINES

TeamCal communities should be safe, respectful, and useful.

Be respectful. Do not harass, bully, stalk, threaten, shame, or target others. Do not promote hatred or unlawful discrimination.

Keep people safe. Sexual exploitation, content sexualizing minors, credible threats, instructions for serious harm, encouragement of self-harm, and illegal activity are prohibited.

Be authentic. Do not impersonate others, create deceptive accounts, manipulate engagement, scam users, spam, or make misleading health or earnings claims.

Respect privacy and ownership. Do not publish private information without permission or upload material you do not have the right to use.

Use health and AI content responsibly. Do not present unqualified advice as medical diagnosis or knowingly publish dangerous or deceptive AI output.

Marketplace and creator offers must be lawful, accurate, and deliver what they promise.

Use Report when content or conduct may violate these guidelines. Use Block when you do not want another user to interact with you. TeamCal may remove content, limit features, suspend accounts, or terminate accounts based on severity and repeated violations.`,
  },
};
