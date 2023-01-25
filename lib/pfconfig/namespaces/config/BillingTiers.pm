package pfconfig::namespaces::config::BillingTiers;

=head1 NAME

pfconfig::namespaces::config::Authentication

=cut

=head1 DESCRIPTION

pfconfig::namespaces::config::Authentication

This module creates the configuration hash associated to authentication.conf

It also stores the information for @authentication_sources and %authentication_lookup

=cut

use strict;
use warnings;

use pfconfig::namespaces::config;
use pf::file_paths qw($billing_tiers_config_file);
use base 'pfconfig::namespaces::config';

sub init {
    my ($self) = @_;
    $self->{file}            = $billing_tiers_config_file;
    $self->{child_resources} = [ qw(resource::RolesReverseLookup) ];
}

sub build_child {
    my ($self) = @_;

    my %cfg = %{ $self->{cfg} };

    while (my ($key, $val) = each %cfg) {
        $val->{id} = $key;
    }

    $self->roleReverseLookup(\%cfg, 'billing_tiers', qw(role));
    return \%cfg;
}


=head1 AUTHOR

Inverse inc. <info@inverse.ca>

=head1 COPYRIGHT

Copyright (C) 2005-2023 Inverse inc.

=head1 LICENSE

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301,
USA.

=cut

1;

# vim: set shiftwidth=4:
# vim: set expandtab:
# vim: set backspace=indent,eol,start:

