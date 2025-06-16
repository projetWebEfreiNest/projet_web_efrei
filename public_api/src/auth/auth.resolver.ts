import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity'; // <- renommé ici
import { CreateAuthInput } from './dto/create-auth.input';
import { UpdateAuthInput } from './dto/update-auth.input';

@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateAuthInput) {
    return this.authService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.authService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.authService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateAuthInput) {
    return this.authService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.authService.remove(id);
  }

  @Mutation(() => String, { name: 'login' })
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<string> {
    const { access_token } = await this.authService.login(email, password);
    return access_token;
  }

  @Mutation(() => User)
  async deleteUser(
    @Args('id', { type: () => Int }) id: number,
  ) {
    return this.authService.deleteUser(id);
  }
}
